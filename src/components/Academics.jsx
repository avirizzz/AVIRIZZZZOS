import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { AppContext } from '../context/AppContext';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../context/AppContext';
import '../styles/Academics.css';

const Academics = () => {
  const { addXP } = useContext(AppContext);
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({
    id: '',
    name: '',
    currentGrade: '',
    targetGrade: '',
    difficulty: 'medium',
    tests: [],
    notes: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [newTest, setNewTest] = useState({
    id: '',
    name: '',
    date: '',
    score: '',
    maxScore: ''
  });

  // Load subjects from localStorage on component mount
  useEffect(() => {
    const savedSubjects = localStorage.getItem('academicSubjects');
    if (savedSubjects) {
      setSubjects(JSON.parse(savedSubjects));
    }
  }, []);

  // Save subjects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('academicSubjects', JSON.stringify(subjects));
  }, [subjects]);

  const handleSubjectInputChange = (e) => {
    const { name, value } = e.target;
    setNewSubject(prev => ({ ...prev, [name]: value }));
  };

  const handleTestInputChange = (e) => {
    const { name, value } = e.target;
    setNewTest(prev => ({ ...prev, [name]: value }));
  };

  const addSubject = (e) => {
    e.preventDefault();
    
    if (!newSubject.name) {
      alert('Please enter a subject name');
      return;
    }
    
    const subjectToAdd = {
      ...newSubject,
      id: uuidv4(),
      tests: []
    };
    
    setSubjects(prev => [...prev, subjectToAdd]);
    setNewSubject({
      id: '',
      name: '',
      currentGrade: '',
      targetGrade: '',
      difficulty: 'medium',
      tests: [],
      notes: ''
    });
    setShowForm(false);
    
    // Add XP for adding a new subject
    addXP(10, 'academics');
  };

  const addTest = (e) => {
    e.preventDefault();
    
    if (!newTest.name || !newTest.date) {
      alert('Please fill in the required fields');
      return;
    }
    
    const testToAdd = {
      ...newTest,
      id: uuidv4()
    };
    
    setSubjects(prev => prev.map(subject => {
      if (subject.id === selectedSubject.id) {
        return {
          ...subject,
          tests: [...subject.tests, testToAdd]
        };
      }
      return subject;
    }));
    
    setNewTest({
      id: '',
      name: '',
      date: '',
      score: '',
      maxScore: ''
    });
    
    // Add XP for adding a test result
    addXP(5, 'academics');
    
    // If the test has a score, calculate additional XP based on performance
    if (testToAdd.score && testToAdd.maxScore) {
      const scorePercentage = (parseFloat(testToAdd.score) / parseFloat(testToAdd.maxScore)) * 100;
      
      // Award XP based on score percentage
      if (scorePercentage >= 90) {
        addXP(20, 'academics');
      } else if (scorePercentage >= 80) {
        addXP(15, 'academics');
      } else if (scorePercentage >= 70) {
        addXP(10, 'academics');
      } else if (scorePercentage >= 60) {
        addXP(5, 'academics');
      }
    }
  };

  const deleteSubject = (id) => {
    setSubjects(prev => prev.filter(subject => subject.id !== id));
    if (selectedSubject && selectedSubject.id === id) {
      setSelectedSubject(null);
    }
  };

  const deleteTest = (subjectId, testId) => {
    setSubjects(prev => prev.map(subject => {
      if (subject.id === subjectId) {
        return {
          ...subject,
          tests: subject.tests.filter(test => test.id !== testId)
        };
      }
      return subject;
    }));
  };

  const updateSubjectNotes = (id, notes) => {
    setSubjects(prev => prev.map(subject => {
      if (subject.id === id) {
        return { ...subject, notes };
      }
      return subject;
    }));
  };

  const calculateAverageScore = (tests) => {
    if (tests.length === 0) return 'N/A';
    
    const validTests = tests.filter(test => test.score && test.maxScore);
    if (validTests.length === 0) return 'N/A';
    
    const totalPercentage = validTests.reduce((sum, test) => {
      return sum + (parseFloat(test.score) / parseFloat(test.maxScore) * 100);
    }, 0);
    
    return (totalPercentage / validTests.length).toFixed(1) + '%';
  };

  const getGradeColor = (grade) => {
    if (!grade) return '#b8b8b8';
    
    const gradeValue = parseFloat(grade);
    if (isNaN(gradeValue)) {
      // Handle letter grades
      switch(grade.toUpperCase()) {
        case 'A': case 'A+': case 'A-': return '#4cc9f0';
        case 'B': case 'B+': case 'B-': return '#4361ee';
        case 'C': case 'C+': case 'C-': return '#7209b7';
        case 'D': case 'D+': case 'D-': return '#f72585';
        case 'F': return '#e63946';
        default: return '#b8b8b8';
      }
    } else {
      // Handle percentage grades
      if (gradeValue >= 90) return '#4cc9f0';
      if (gradeValue >= 80) return '#4361ee';
      if (gradeValue >= 70) return '#7209b7';
      if (gradeValue >= 60) return '#f72585';
      return '#e63946';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <motion.div 
      className="component-container academics-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="academics-header">
        <h1>Academic Progress Tracker</h1>
        <p>Track your subjects, grades, and test results</p>
      </div>

      <div className="academics-content">
        <div className="subjects-list">
          <h2>Your Subjects</h2>
          
          {subjects.length > 0 ? (
            <div className="subject-cards">
              {subjects.map(subject => (
                <motion.div 
                  key={subject.id} 
                  className={`subject-card ${selectedSubject && selectedSubject.id === subject.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSubject(subject)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <h3>{subject.name}</h3>
                  <div className="subject-grades">
                    <div className="grade-item">
                      <span>Current:</span>
                      <span 
                        className="grade-value"
                        style={{ color: getGradeColor(subject.currentGrade) }}
                      >
                        {subject.currentGrade || 'N/A'}
                      </span>
                    </div>
                    <div className="grade-item">
                      <span>Target:</span>
                      <span className="grade-value">{subject.targetGrade || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="subject-stats">
                    <div className="stat-item">
                      <span>Tests:</span>
                      <span>{subject.tests.length}</span>
                    </div>
                    <div className="stat-item">
                      <span>Average:</span>
                      <span>{calculateAverageScore(subject.tests)}</span>
                    </div>
                    <div className="stat-item">
                      <span>Difficulty:</span>
                      <span className={`difficulty ${subject.difficulty}`}>{subject.difficulty}</span>
                    </div>
                  </div>
                  <button 
                    className="delete-subject-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSubject(subject.id);
                    }}
                  >
                    Delete
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="no-subjects">
              <p>No subjects added yet. Add your first subject to start tracking!</p>
            </div>
          )}

          <button 
            className="add-subject-btn"
            onClick={() => {
              setShowForm(!showForm);
              setSelectedSubject(null);
            }}
          >
            {showForm ? 'Cancel' : '+ Add Subject'}
          </button>

          {showForm && (
            <motion.form 
              className="subject-form"
              onSubmit={addSubject}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="form-group">
                <label htmlFor="name">Subject Name*</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newSubject.name}
                  onChange={handleSubjectInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="currentGrade">Current Grade</label>
                  <input
                    type="text"
                    id="currentGrade"
                    name="currentGrade"
                    value={newSubject.currentGrade}
                    onChange={handleSubjectInputChange}
                    placeholder="A, B, 95%, etc."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="targetGrade">Target Grade</label>
                  <input
                    type="text"
                    id="targetGrade"
                    name="targetGrade"
                    value={newSubject.targetGrade}
                    onChange={handleSubjectInputChange}
                    placeholder="A, B, 95%, etc."
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="difficulty">Difficulty Level</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={newSubject.difficulty}
                  onChange={handleSubjectInputChange}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="very-hard">Very Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={newSubject.notes}
                  onChange={handleSubjectInputChange}
                  placeholder="Add any notes about this subject..."
                  rows="3"
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">Add Subject</button>
            </motion.form>
          )}
        </div>

        {selectedSubject && (
          <div className="subject-details">
            <div className="subject-details-header">
              <h2>{selectedSubject.name}</h2>
              <div className="subject-grades-detail">
                <div className="grade-item">
                  <span>Current Grade:</span>
                  <span 
                    className="grade-value"
                    style={{ color: getGradeColor(selectedSubject.currentGrade) }}
                  >
                    {selectedSubject.currentGrade || 'N/A'}
                  </span>
                </div>
                <div className="grade-item">
                  <span>Target Grade:</span>
                  <span className="grade-value">{selectedSubject.targetGrade || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="subject-notes">
              <h3>Notes</h3>
              <textarea
                value={selectedSubject.notes}
                onChange={(e) => updateSubjectNotes(selectedSubject.id, e.target.value)}
                placeholder="Add notes about this subject..."
                rows="4"
              ></textarea>
            </div>

            <div className="subject-tests">
              <h3>Tests & Assessments</h3>
              
              {selectedSubject.tests.length > 0 ? (
                <div className="tests-list">
                  {selectedSubject.tests.map(test => (
                    <motion.div 
                      key={test.id} 
                      className="test-item"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="test-header">
                        <h4>{test.name}</h4>
                        <span className="test-date">{formatDate(test.date)}</span>
                      </div>
                      <div className="test-score">
                        {test.score && test.maxScore ? (
                          <>
                            <span className="score-value">
                              {test.score}/{test.maxScore}
                            </span>
                            <span className="score-percentage">
                              ({((parseFloat(test.score) / parseFloat(test.maxScore)) * 100).toFixed(1)}%)
                            </span>
                          </>
                        ) : (
                          <span className="score-value">No score recorded</span>
                        )}
                        <button 
                          className="delete-test-btn"
                          onClick={() => deleteTest(selectedSubject.id, test.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="no-tests">
                  <p>No tests recorded for this subject yet.</p>
                </div>
              )}

              <form className="test-form" onSubmit={addTest}>
                <h4>Add New Test</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="testName">Test Name*</label>
                    <input
                      type="text"
                      id="testName"
                      name="name"
                      value={newTest.name}
                      onChange={handleTestInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="testDate">Date*</label>
                    <input
                      type="date"
                      id="testDate"
                      name="date"
                      value={newTest.date}
                      onChange={handleTestInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="testScore">Your Score</label>
                    <input
                      type="number"
                      id="testScore"
                      name="score"
                      value={newTest.score}
                      onChange={handleTestInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="testMaxScore">Max Score</label>
                    <input
                      type="number"
                      id="testMaxScore"
                      name="maxScore"
                      value={newTest.maxScore}
                      onChange={handleTestInputChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <button type="submit" className="add-test-btn">Add Test</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Academics;
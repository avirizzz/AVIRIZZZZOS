import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { AppContext } from '../context/AppContext';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../context/AppContext';
import '../styles/Goals.css';

const Goals = () => {
  const { addXP } = useContext(AppContext);
  const [goals, setGoals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [newGoal, setNewGoal] = useState({
    id: '',
    title: '',
    description: '',
    deadline: '',
    priority: 'medium',
    completed: false,
    progress: 0,
    category: 'weekly'
  });
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('weekly');
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  // Load goals and achievements from localStorage on component mount
  useEffect(() => {
    const savedGoals = localStorage.getItem('userGoals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
    
    const savedAchievements = localStorage.getItem('userAchievements');
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    } else {
      // Initialize with some default achievements
      const defaultAchievements = [
        {
          id: uuidv4(),
          title: 'Goal Setter',
          description: 'Set your first goal',
          unlocked: false,
          xpReward: 50,
          icon: '🎯'
        },
        {
          id: uuidv4(),
          title: 'Achievement Hunter',
          description: 'Complete 5 goals',
          unlocked: false,
          xpReward: 100,
          icon: '🏆'
        },
        {
          id: uuidv4(),
          title: 'Overachiever',
          description: 'Complete 10 goals',
          unlocked: false,
          xpReward: 200,
          icon: '⭐'
        },
        {
          id: uuidv4(),
          title: 'Master Planner',
          description: 'Have goals in all categories',
          unlocked: false,
          xpReward: 150,
          icon: '📝'
        },
        {
          id: uuidv4(),
          title: 'Perfectionist',
          description: 'Complete 3 high priority goals',
          unlocked: false,
          xpReward: 200,
          icon: '💯'
        }
      ];
      setAchievements(defaultAchievements);
      localStorage.setItem('userAchievements', JSON.stringify(defaultAchievements));
    }
  }, []);

  // Save goals and achievements to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('userGoals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('userAchievements', JSON.stringify(achievements));
  }, [achievements]);

  // Check for achievements
  useEffect(() => {
    checkAchievements();
  }, [goals]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal(prev => ({ ...prev, [name]: value }));
  };

  const addGoal = (e) => {
    e.preventDefault();
    
    if (!newGoal.title) {
      alert('Please enter a goal title');
      return;
    }
    
    const goalToAdd = {
      ...newGoal,
      id: uuidv4(),
      completed: false,
      progress: 0,
      category: activeTab
    };
    
    setGoals(prev => [...prev, goalToAdd]);
    setNewGoal({
      id: '',
      title: '',
      description: '',
      deadline: '',
      priority: 'medium',
      completed: false,
      progress: 0,
      category: activeTab
    });
    setShowForm(false);
    
    // Add XP for creating a new goal
    addXP(10, 'goals');
    
    // Check if this is the first goal (for achievement)
    if (goals.length === 0) {
      unlockAchievement('Goal Setter');
    }
  };

  const updateGoalProgress = (id, progress) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === id) {
        const newProgress = Math.min(Math.max(parseInt(progress), 0), 100);
        const wasCompleted = goal.completed;
        const isNowCompleted = newProgress === 100;
        
        // If newly completed, award XP
        if (!wasCompleted && isNowCompleted) {
          const xpAmount = goal.priority === 'high' ? 30 : 
                          goal.priority === 'medium' ? 20 : 10;
          addXP(xpAmount, 'goals');
        }
        
        return { 
          ...goal, 
          progress: newProgress,
          completed: isNowCompleted
        };
      }
      return goal;
    }));
  };

  const toggleGoalCompletion = (id) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === id) {
        const newCompletedState = !goal.completed;
        
        // If newly completed, set progress to 100% and award XP
        if (newCompletedState) {
          const xpAmount = goal.priority === 'high' ? 30 : 
                          goal.priority === 'medium' ? 20 : 10;
          addXP(xpAmount, 'goals');
          return { ...goal, completed: true, progress: 100 };
        }
        
        // If uncompleting, just toggle the completed state
        return { ...goal, completed: false };
      }
      return goal;
    }));
  };

  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(goal => goal.id !== id));
  };

  const checkAchievements = () => {
    // Count completed goals
    const completedGoals = goals.filter(goal => goal.completed).length;
    
    // Count completed high priority goals
    const completedHighPriorityGoals = goals.filter(
      goal => goal.completed && goal.priority === 'high'
    ).length;
    
    // Check if there are goals in all categories
    const hasWeeklyGoals = goals.some(goal => goal.category === 'weekly');
    const hasMonthlyGoals = goals.some(goal => goal.category === 'monthly');
    const hasYearlyGoals = goals.some(goal => goal.category === 'yearly');
    const hasLifeGoals = goals.some(goal => goal.category === 'life');
    const hasGoalsInAllCategories = hasWeeklyGoals && hasMonthlyGoals && hasYearlyGoals && hasLifeGoals;
    
    // Update achievements
    let updatedAchievements = [...achievements];
    
    if (completedGoals >= 5) {
      updatedAchievements = unlockAchievementInArray(updatedAchievements, 'Achievement Hunter');
    }
    
    if (completedGoals >= 10) {
      updatedAchievements = unlockAchievementInArray(updatedAchievements, 'Overachiever');
    }
    
    if (hasGoalsInAllCategories) {
      updatedAchievements = unlockAchievementInArray(updatedAchievements, 'Master Planner');
    }
    
    if (completedHighPriorityGoals >= 3) {
      updatedAchievements = unlockAchievementInArray(updatedAchievements, 'Perfectionist');
    }
    
    setAchievements(updatedAchievements);
  };

  const unlockAchievement = (title) => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.title === title && !achievement.unlocked) {
        // Award XP for unlocking achievement
        addXP(achievement.xpReward, 'goals');
        
        // Show notification
        alert(`Achievement Unlocked: ${achievement.title}\n${achievement.description}\n+${achievement.xpReward} XP`);
        
        return { ...achievement, unlocked: true };
      }
      return achievement;
    }));
  };

  const unlockAchievementInArray = (achievementsArray, title) => {
    return achievementsArray.map(achievement => {
      if (achievement.title === title && !achievement.unlocked) {
        // Award XP for unlocking achievement
        addXP(achievement.xpReward, 'goals');
        
        // Show notification
        alert(`Achievement Unlocked: ${achievement.title}\n${achievement.description}\n+${achievement.xpReward} XP`);
        
        return { ...achievement, unlocked: true };
      }
      return achievement;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getDeadlineClass = (deadline) => {
    const daysRemaining = getDaysRemaining(deadline);
    
    if (daysRemaining === null) return '';
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= 3) return 'urgent';
    if (daysRemaining <= 7) return 'approaching';
    return '';
  };

  const filteredGoals = goals.filter(goal => goal.category === activeTab);

  return (
    <motion.div 
      className="component-container goals-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="goals-header">
        <h1>Goals & Achievements</h1>
        <p>Track your progress and unlock achievements</p>
      </div>

      <div className="goals-tabs">
        <button 
          className={activeTab === 'weekly' ? 'active' : ''}
          onClick={() => setActiveTab('weekly')}
        >
          Weekly Goals
        </button>
        <button 
          className={activeTab === 'monthly' ? 'active' : ''}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly Goals
        </button>
        <button 
          className={activeTab === 'yearly' ? 'active' : ''}
          onClick={() => setActiveTab('yearly')}
        >
          Yearly Goals
        </button>
        <button 
          className={activeTab === 'life' ? 'active' : ''}
          onClick={() => setActiveTab('life')}
        >
          Life Goals
        </button>
      </div>

      <div className="goals-content">
        <div className="goals-list">
          <div className="goals-list-header">
            <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Goals</h2>
            <button 
              className="add-goal-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancel' : '+ Add Goal'}
            </button>
          </div>

          {showForm && (
            <motion.form 
              className="goal-form"
              onSubmit={addGoal}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="form-group">
                <label htmlFor="title">Goal Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newGoal.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={newGoal.description}
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="deadline">Deadline</label>
                  <input
                    type="date"
                    id="deadline"
                    name="deadline"
                    value={newGoal.deadline}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={newGoal.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="submit-btn">Add Goal</button>
            </motion.form>
          )}

          {filteredGoals.length > 0 ? (
            <div className="goals-grid">
              {filteredGoals.map(goal => (
                <motion.div 
                  key={goal.id} 
                  className={`goal-card ${goal.completed ? 'completed' : ''} priority-${goal.priority}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="goal-header">
                    <h3>{goal.title}</h3>
                    <span className={`priority ${goal.priority}`}>
                      {goal.priority}
                    </span>
                  </div>
                  
                  {goal.description && (
                    <p className="goal-description">{goal.description}</p>
                  )}
                  
                  {goal.deadline && (
                    <div className={`goal-deadline ${getDeadlineClass(goal.deadline)}`}>
                      <span>Deadline: {formatDate(goal.deadline)}</span>
                      {getDaysRemaining(goal.deadline) !== null && (
                        <span className="days-remaining">
                          {getDaysRemaining(goal.deadline) < 0 
                            ? `${Math.abs(getDaysRemaining(goal.deadline))} days overdue` 
                            : `${getDaysRemaining(goal.deadline)} days remaining`}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="goal-progress">
                    <div className="progress-label">
                      <span>Progress: {goal.progress}%</span>
                      {goal.completed && <span className="completed-label">Completed!</span>}
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={goal.progress} 
                      onChange={(e) => updateGoalProgress(goal.id, e.target.value)}
                      className="progress-slider"
                    />
                  </div>
                  
                  <div className="goal-actions">
                    <button 
                      className={`complete-btn ${goal.completed ? 'completed' : ''}`}
                      onClick={() => toggleGoalCompletion(goal.id)}
                    >
                      {goal.completed ? 'Mark Incomplete' : 'Mark Complete'}
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="no-goals">
              <p>No {activeTab} goals added yet. Add your first goal to start tracking!</p>
            </div>
          )}
        </div>

        <div className="achievements-section">
          <h2>Achievements</h2>
          <div className="achievements-grid">
            {achievements.map(achievement => (
              <motion.div 
                key={achievement.id} 
                className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="achievement-icon">{achievement.icon}</div>
                <h3>{achievement.title}</h3>
                <p>{achievement.description}</p>
                <div className="achievement-reward">
                  <span>+{achievement.xpReward} XP</span>
                  <span className="achievement-status">
                    {achievement.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Goals;
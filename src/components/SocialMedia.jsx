import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { AppContext } from '../context/AppContext';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../context/AppContext';
import '../styles/SocialMedia.css';

const SocialMedia = () => {
  const { addXP } = useContext(AppContext);
  const [platforms, setPlatforms] = useState([]);
  const [newPlatform, setNewPlatform] = useState({
    id: '',
    name: '',
    icon: '📱', // Default icon
    timeLimit: 60, // Default time limit in minutes
    usageToday: 0,
    usageWeek: 0,
    usageMonth: 0,
    disciplineLevel: 1,
    notes: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [viewMode, setViewMode] = useState('today'); // today, week, month
  const [disciplineScore, setDisciplineScore] = useState(0);

  // Load platforms from localStorage on component mount
  useEffect(() => {
    const savedPlatforms = localStorage.getItem('socialMediaPlatforms');
    if (savedPlatforms) {
      setPlatforms(JSON.parse(savedPlatforms));
    }
  }, []);

  // Save platforms to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('socialMediaPlatforms', JSON.stringify(platforms));
    calculateDisciplineScore();
  }, [platforms]);

  const calculateDisciplineScore = () => {
    if (platforms.length === 0) {
      setDisciplineScore(0);
      return;
    }
    
    // Calculate discipline score based on how well users stay under their time limits
    let totalScore = 0;
    
    platforms.forEach(platform => {
      const usagePercent = (platform.usageToday / (platform.timeLimit * 60)) * 100;
      
      // If usage is under limit, add points; if over limit, subtract points
      if (usagePercent <= 100) {
        // More points for staying well under limit
        totalScore += 100 - usagePercent;
      } else {
        // Penalty for going over limit
        totalScore -= (usagePercent - 100) * 0.5;
      }
    });
    
    // Normalize score between 0-100
    const normalizedScore = Math.max(0, Math.min(100, totalScore / platforms.length));
    setDisciplineScore(Math.round(normalizedScore));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPlatform(prev => ({ ...prev, [name]: value }));
  };

  const addPlatform = (e) => {
    e.preventDefault();
    
    if (!newPlatform.name) {
      alert('Please enter a platform name');
      return;
    }
    
    const platformToAdd = {
      ...newPlatform,
      id: uuidv4(),
      timeLimit: parseInt(newPlatform.timeLimit) || 60,
      usageToday: 0,
      usageWeek: 0,
      usageMonth: 0,
      disciplineLevel: 1
    };
    
    setPlatforms(prev => [...prev, platformToAdd]);
    setNewPlatform({
      id: '',
      name: '',
      icon: '📱',
      timeLimit: 60,
      usageToday: 0,
      usageWeek: 0,
      usageMonth: 0,
      disciplineLevel: 1,
      notes: ''
    });
    setShowForm(false);
    
    // Add XP for adding a new platform to track
    addXP(5, 'social');
  };

  // Update the updatePlatformUsage function
  const updatePlatformUsage = (id, minutes, timeframe = 'today') => {
    const numericMinutes = parseInt(minutes) || 0;
    
    const updatedPlatforms = platforms.map(platform => {
      if (platform.id === id) {
        const updatedPlatform = { ...platform };
        
        switch (timeframe) {
          case 'today':
            updatedPlatform.usageToday = numericMinutes * 60;
            break;
          case 'week':
            updatedPlatform.usageWeek = numericMinutes * 60;
            break;
          case 'month':
            updatedPlatform.usageMonth = numericMinutes * 60;
            break;
        }
        
        return updatedPlatform;
      }
      return platform;
    });

    setPlatforms(updatedPlatforms);
    setSelectedPlatform(updatedPlatforms.find(p => p.id === id));
  };

  const updatePlatformTimeLimit = (id, minutes) => {
    setPlatforms(prev => prev.map(platform => {
      if (platform.id === id) {
        return { 
          ...platform, 
          timeLimit: Math.max(1, parseInt(minutes) || 60)
        };
      }
      return platform;
    }));
  };

  const updatePlatformNotes = (id, notes) => {
    setPlatforms(prev => prev.map(platform => {
      if (platform.id === id) {
        return { ...platform, notes };
      }
      return platform;
    }));
  };

  const deletePlatform = (id) => {
    setPlatforms(prev => prev.filter(platform => platform.id !== id));
    if (selectedPlatform && selectedPlatform.id === id) {
      setSelectedPlatform(null);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateUsagePercentage = (usage, limit) => {
    const percentage = (usage / (limit * 60)) * 100;
    return Math.min(100, percentage); // Cap at 100% for progress bar display
  };

  const getUsageColor = (usage, limit) => {
    const percentage = (usage / (limit * 60)) * 100;
    
    if (percentage <= 50) return 'var(--success-color)';
    if (percentage <= 80) return 'var(--warning-color)';
    if (percentage <= 100) return 'var(--warning-dark)';
    return 'var(--danger-color)';
  };

  const getDisciplineLevel = (level) => {
    const roundedLevel = Math.round(level);
    switch (roundedLevel) {
      case 5: return 'Master';
      case 4: return 'Expert';
      case 3: return 'Adept';
      case 2: return 'Novice';
      case 1: default: return 'Beginner';
    }
  };

  const getDisciplineColor = (level) => {
    const roundedLevel = Math.round(level);
    switch (roundedLevel) {
      case 5: return '#4caf50';
      case 4: return '#8bc34a';
      case 3: return '#ffc107';
      case 2: return '#ff9800';
      case 1: default: return '#f44336';
    }
  };

  const getUsageForView = (platform) => {
    switch (viewMode) {
      case 'week': return platform.usageWeek;
      case 'month': return platform.usageMonth;
      case 'today': default: return platform.usageToday;
    }
  };

  const getOverallDisciplineLevel = () => {
    if (disciplineScore >= 90) return 'Master';
    if (disciplineScore >= 75) return 'Expert';
    if (disciplineScore >= 60) return 'Adept';
    if (disciplineScore >= 40) return 'Novice';
    return 'Beginner';
  };

  return (
    <motion.div 
      className="social-media-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="social-media-header">
        <h1>Social Media Usage Tracker</h1>
        <p>Track your screen time and build digital discipline</p>
      </div>

      <div className="discipline-overview">
        <div className="discipline-score">
          <h3>Discipline Score</h3>
          <div className="score-circle" style={{ background: `conic-gradient(${getDisciplineColor(disciplineScore / 20)}, ${disciplineScore}%, var(--bg-secondary) ${disciplineScore}%)` }}>
            <span>{disciplineScore}</span>
          </div>
          <p className="discipline-level">{getOverallDisciplineLevel()}</p>
        </div>
        
        <div className="discipline-tips">
          <h3>Digital Wellness Tips</h3>
          <ul>
            <li>Set realistic time limits for each platform</li>
            <li>Take regular breaks from screens</li>
            <li>Disable non-essential notifications</li>
            <li>Use grayscale mode to reduce app appeal</li>
            <li>Track your progress and celebrate improvements</li>
          </ul>
        </div>
      </div>

      <div className="social-media-content">
        <div className="platforms-list">
          <div className="platforms-list-header">
            <h2>Your Platforms</h2>
            <div className="view-mode-selector">
              <button 
                className={viewMode === 'today' ? 'active' : ''}
                onClick={() => setViewMode('today')}
              >
                Today
              </button>
              <button 
                className={viewMode === 'week' ? 'active' : ''}
                onClick={() => setViewMode('week')}
              >
                Week
              </button>
              <button 
                className={viewMode === 'month' ? 'active' : ''}
                onClick={() => setViewMode('month')}
              >
                Month
              </button>
            </div>
            <button 
              className="add-platform-btn"
              onClick={() => {
                setShowForm(!showForm);
                setSelectedPlatform(null);
              }}
            >
              {showForm ? 'Cancel' : '+ Add Platform'}
            </button>
          </div>

          {showForm && (
            <motion.form 
              className="platform-form"
              onSubmit={addPlatform}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Platform Name*</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newPlatform.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Instagram, TikTok"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="icon">Icon</label>
                  <select
                    id="icon"
                    name="icon"
                    value={newPlatform.icon}
                    onChange={handleInputChange}
                  >
                    <option value="📱">📱 General</option>
                    <option value="📸">📸 Instagram</option>
                    <option value="🐦">🐦 Twitter/X</option>
                    <option value="👥">👥 Facebook</option>
                    <option value="💼">💼 LinkedIn</option>
                    <option value="🎮">🎮 Gaming</option>
                    <option value="📺">📺 YouTube</option>
                    <option value="🎵">🎵 TikTok</option>
                    <option value="💬">💬 Messaging</option>
                    <option value="🌐">🌐 Web Browsing</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="timeLimit">Daily Time Limit (minutes)</label>
                <input
                  type="number"
                  id="timeLimit"
                  name="timeLimit"
                  value={newPlatform.timeLimit}
                  onChange={handleInputChange}
                  min="1"
                  max="1440"
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={newPlatform.notes}
                  onChange={handleInputChange}
                  placeholder="Why are you tracking this platform? What are your goals?"
                  rows="3"
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">Add Platform</button>
            </motion.form>
          )}

          {platforms.length > 0 ? (
            <div className="platforms-grid">
              {platforms.map(platform => {
                const usage = getUsageForView(platform);
                const usagePercentage = calculateUsagePercentage(usage, platform.timeLimit);
                const usageColor = getUsageColor(usage, platform.timeLimit);
                
                return (
                  <motion.div 
                    key={platform.id} 
                    className={`platform-card ${selectedPlatform && selectedPlatform.id === platform.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPlatform(platform)}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="platform-icon">{platform.icon}</div>
                    
                    <div className="platform-header">
                      <h3>{platform.name}</h3>
                      <div 
                        className="discipline-badge"
                        style={{ backgroundColor: getDisciplineColor(platform.disciplineLevel) }}
                      >
                        {getDisciplineLevel(platform.disciplineLevel)}
                      </div>
                    </div>
                    
                    <div className="platform-usage">
                      <div className="usage-label">
                        <span>Usage ({viewMode}):</span>
                        <span>{formatTime(usage)} / {platform.timeLimit}m</span>
                      </div>
                      <div className="usage-bar-container">
                        <div 
                          className="usage-bar" 
                          style={{ 
                            width: `${usagePercentage}%`,
                            backgroundColor: usageColor
                          }}
                        ></div>
                      </div>
                      {usage > platform.timeLimit * 60 && (
                        <div className="over-limit-warning">
                          Over limit by {formatTime(usage - platform.timeLimit * 60)}
                        </div>
                      )}
                    </div>
                    
                    <button 
                      className="delete-platform-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlatform(platform.id);
                      }}
                    >
                      Delete
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="no-platforms">
              <p>No platforms added yet. Add your first platform to start tracking!</p>
            </div>
          )}
        </div>

        {selectedPlatform && (
          <div className="platform-details">
            <div className="platform-details-header">
              <div className="platform-title">
                <span className="platform-icon-large">{selectedPlatform.icon}</span>
                <h2>{selectedPlatform.name}</h2>
              </div>
              <div 
                className="discipline-badge-large"
                style={{ backgroundColor: getDisciplineColor(selectedPlatform.disciplineLevel) }}
              >
                {getDisciplineLevel(selectedPlatform.disciplineLevel)}
              </div>
            </div>

            <div className="usage-update-section">
              <h3>Update Usage</h3>
              
              <div className="usage-tabs">
                <button 
                  className={viewMode === 'today' ? 'active' : ''}
                  onClick={() => setViewMode('today')}
                >
                  Today
                </button>
                <button 
                  className={viewMode === 'week' ? 'active' : ''}
                  onClick={() => setViewMode('week')}
                >
                  This Week
                </button>
                <button 
                  className={viewMode === 'month' ? 'active' : ''}
                  onClick={() => setViewMode('month')}
                >
                  This Month
                </button>
              </div>
              
              <div className="usage-input">
                <div className="time-input-container">
                  <input 
                    type="number" 
                    value={Math.floor(getUsageForView(selectedPlatform) / 60)}
                    onChange={(e) => updatePlatformUsage(
                      selectedPlatform.id, 
                      e.target.value,
                      viewMode
                    )}
                    min="0"
                    max="1440"
                  />
                  <span>minutes</span>
                </div>
              </div>
              
              <div className="usage-percentage">
                {calculateUsagePercentage(getUsageForView(selectedPlatform), selectedPlatform.timeLimit)}% of daily limit
              </div>
            </div>

            <div className="time-limit-section">
              <h3>Daily Time Limit</h3>
              <div className="time-input-group">
                <input 
                  type="number" 
                  value={selectedPlatform.timeLimit} 
                  onChange={(e) => updatePlatformTimeLimit(selectedPlatform.id, e.target.value)}
                  min="1"
                  max="1440"
                />
                <span>minutes</span>
              </div>
              <p className="limit-suggestion">
                Recommended: Set limits that reduce your current usage by 10-20% each week
              </p>
            </div>

            <div className="platform-notes">
              <h3>Notes</h3>
              <textarea
                value={selectedPlatform.notes}
                onChange={(e) => updatePlatformNotes(selectedPlatform.id, e.target.value)}
                placeholder="Add notes about your usage goals for this platform..."
                rows="4"
              ></textarea>
            </div>

            <div className="discipline-tips-small">
              <h3>Tips for {selectedPlatform.name}</h3>
              <ul>
                <li>Use app timers to enforce your limits</li>
                <li>Turn off notifications during focus time</li>
                <li>Delete the app on weekends for digital detox</li>
                <li>Replace some scrolling time with offline activities</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SocialMedia;
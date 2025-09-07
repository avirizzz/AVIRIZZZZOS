import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useAppContext } from '../context/AppContext';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../context/AppContext';
import '../styles/HabitTracker.css';

const HabitTracker = () => {
  const { user, authLoading, addXP } = useAppContext();
  const [habits, setHabits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    type: 'habit',
    level: 1,
    xp: 0,
    nextLevelXP: 100,
    streak: 0,
    completed: false
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  // Load habits from Firebase when component mounts
  useEffect(() => {
    if (user) {
      const loadHabits = async () => {
        const habitsRef = collection(db, 'habits');
        const q = query(habitsRef, where("userId", "==", user.uid));
        
        try {
          const querySnapshot = await getDocs(q);
          const loadedHabits = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setHabits(loadedHabits);
        } catch (error) {
          console.error("Error loading habits:", error);
        }
      };

      loadHabits();
    }
  }, [user]);

  // Save habits to Firebase when they change
  useEffect(() => {
    if (user && habits.length > 0) {
      habits.forEach(async (habit) => {
        if (!habit.id) return;
        
        const habitRef = doc(db, 'habits', habit.id);
        try {
          await setDoc(habitRef, {
            ...habit,
            userId: user.uid,
            lastUpdated: serverTimestamp()
          });
        } catch (error) {
          console.error("Error saving habit:", error);
        }
      });
    }
  }, [habits, user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewHabit(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new habit or hobby
  const addHabit = (e) => {
    e.preventDefault();
    if (!newHabit.name.trim()) return;

    const habit = {
      id: uuidv4(),
      name: newHabit.name,
      type: newHabit.type,
      level: 1,
      xp: 0,
      nextLevelXP: 100,
      streak: 0,
      completed: false,
      completionDates: {}
    };

    setHabits(prevHabits => [...prevHabits, habit]);
    setNewHabit({ name: '', type: 'habit' });
    setShowForm(false);
  };

  // Toggle habit completion
  const toggleCompletion = (id) => {
    setHabits(prevHabits => prevHabits.map(habit => {
      if (habit.id === id) {
        const wasCompleted = habit.completed;
        const completed = !wasCompleted;
        let { xp, level, nextLevelXP, streak } = habit;
        
        if (completed && !wasCompleted) {
          xp += 20;
          streak += 1;
          
          if (xp >= nextLevelXP) {
            level += 1;
            xp = xp - nextLevelXP;
            nextLevelXP = Math.floor(nextLevelXP * 1.5);
          }
        } else if (!completed && wasCompleted) {
          xp = Math.max(0, xp - 10);
          streak = Math.max(0, streak - 1);
        }
        
        return { ...habit, completed, xp, level, nextLevelXP, streak };
      }
      return habit;
    }));
  };

  // Delete a habit
  const deleteHabit = (id) => {
    setHabits(prevHabits => prevHabits.filter(habit => habit.id !== id));
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Track habit completion by date
  const toggleCompletionForDate = (id, date) => {
    const updatedHabits = habits.map(habit => {
      if (habit.id === id) {
        // Initialize completionDates if it doesn't exist
        const completionDates = habit.completionDates || {};
        
        // Check previous completion state
        const wasCompleted = completionDates[date] || false;
        const isCompleted = !wasCompleted;
        
        const updatedCompletionDates = {
          ...completionDates,
          [date]: isCompleted
        };
        
        let { xp, level, nextLevelXP, streak } = habit;
        
        // Only modify XP and streak if the completion state actually changes
        if (isCompleted && !wasCompleted) {
          // Only award XP when changing from incomplete to complete
          xp += 20;
          streak += 1;
          
          // Level up if XP threshold reached
          if (xp >= nextLevelXP) {
            level += 1;
            xp = xp - nextLevelXP;
            nextLevelXP = Math.floor(nextLevelXP * 1.5);
          }
        } else if (!isCompleted && wasCompleted) {
          // Only reduce XP when changing from complete to incomplete
          xp = Math.max(0, xp - 10);
          streak = Math.max(0, streak - 1);
        }
        
        return { 
          ...habit, 
          completionDates: updatedCompletionDates,
          xp, 
          level, 
          nextLevelXP, 
          streak 
        };
      }
      return habit;
    });
    
    setHabits(updatedHabits);
  };

  return (
    <motion.div 
      className="component-container habit-tracker-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="habit-header">
        <h2>Habits & Hobbies Tracker</h2>
        <p>Level up your daily activities and track your progress</p>
        <button 
          className="toggle-form-button" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Hide Form' : 'Add New'}
        </button>
      </div>

      {showForm && (
        <motion.div 
          className="add-habit-form"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <form onSubmit={addHabit}>
            <div className="form-group">
              <input
                type="text"
                name="name"
                value={newHabit.name}
                onChange={handleInputChange}
                placeholder="Enter new habit or hobby"
                required
              />
            </div>
            <div className="form-group">
              <select 
                name="type" 
                value={newHabit.type} 
                onChange={handleInputChange}
              >
                <option value="habit">Habit</option>
                <option value="hobby">Hobby</option>
              </select>
            </div>
            <button type="submit" className="add-button">
              Add {newHabit.type === 'habit' ? 'Habit' : 'Hobby'}
            </button>
          </form>
        </motion.div>
      )}

      <motion.div 
        className="habits-list"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {habits.length === 0 ? (
          <div className="no-habits-message">
            <p>No habits or hobbies added yet. Add your first one to start tracking!</p>
          </div>
        ) : (
          habits.map((habit, index) => (
          <motion.div 
            key={habit.id}
            className={`habit-card ${habit.type} ${habit.completed ? 'completed' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="habit-info">
              <h3>{habit.name}</h3>
              <div className="habit-meta">
                <span className={`habit-type ${habit.type}`}>{habit.type.charAt(0).toUpperCase() + habit.type.slice(1)}</span>
                <span className="habit-level">Level {habit.level}</span>
                <span className="habit-streak">{habit.streak} day streak</span>
              </div>
              <div className="xp-bar">
                <div 
                  className="xp-fill" 
                  style={{ width: `${(habit.xp / habit.nextLevelXP) * 100}%` }}
                ></div>
              </div>
              <div className="xp-text">
                {habit.xp} / {habit.nextLevelXP} XP
              </div>
            </div>
            <div className="habit-actions">
              <div className="completion-date">
                <label>Today ({today}): </label>
                <button 
                  className={`complete-button ${habit.completionDates && habit.completionDates[today] ? 'completed' : ''}`}
                  onClick={() => toggleCompletionForDate(habit.id, today)}
                >
                  {habit.completionDates && habit.completionDates[today] ? 'Completed' : 'Complete'}
                </button>
              </div>
              <button 
                className="delete-button"
                onClick={() => deleteHabit(habit.id)}
              >
                Delete
              </button>
            </div>
          </motion.div>
        )))}
      </motion.div>
    </motion.div>
  );
};

export default HabitTracker;
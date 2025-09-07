import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { AppContext } from '../context/AppContext';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../context/AppContext';
import '../styles/Timetable.css';

const Timetable = () => {
  const { addXP } = useContext(AppContext);
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    id: '',
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    duration: 60, // Default duration in minutes
    category: 'study',
    completed: false
  });
  
  const [clickedTimeSlot, setClickedTimeSlot] = useState(null);
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [view, setView] = useState('day'); // day, week, month
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [savedTasks, setSavedTasks] = useState([]);
  const [newSavedTask, setNewSavedTask] = useState('');
  const [showSavedTasksForm, setShowSavedTasksForm] = useState(false);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  // Load events and saved tasks from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem('timetableEvents');
    const savedTasksList = localStorage.getItem('savedTasks');
    
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
    
    if (savedTasksList) {
      setSavedTasks(JSON.parse(savedTasksList));
    }
  }, []);

  // Save events and saved tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('timetableEvents', JSON.stringify(events));
  }, [events]);
  
  useEffect(() => {
    localStorage.setItem('savedTasks', JSON.stringify(savedTasks));
  }, [savedTasks]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const addSavedTask = (e) => {
    e.preventDefault();
    if (!newSavedTask.trim()) return;
    
    setSavedTasks([...savedTasks, { id: uuidv4(), title: newSavedTask }]);
    setNewSavedTask('');
  };
  
  const deleteSavedTask = (id) => {
    setSavedTasks(savedTasks.filter(task => task.id !== id));
  };
  
  const useSavedTask = (taskTitle) => {
    setNewEvent(prev => ({ ...prev, title: taskTitle }));
    setShowForm(true);
  };
  
  const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes + durationMinutes;
    
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };
  
  const handleDurationChange = (duration) => {
    setNewEvent(prev => {
      const endTime = calculateEndTime(prev.startTime, duration);
      return { ...prev, duration, endTime };
    });
  };
  
  const handleTimeSlotClick = (hour) => {
    const formattedHour = hour.toString().padStart(2, '0');
    const startTime = `${formattedHour}:00`;
    const endTime = calculateEndTime(startTime, 60); // Default 60 minutes
    
    setNewEvent(prev => ({
      ...prev,
      date: selectedDateFormatted(),
      startTime,
      endTime,
      duration: 60
    }));
    
    setClickedTimeSlot(formattedHour);
    setQuickAddMode(true);
  };
  
  const addEvent = (e) => {
    if (e) e.preventDefault();
    
    if (!newEvent.title || !newEvent.date || !newEvent.startTime) {
      alert('Please fill in the required fields');
      return;
    }
    
    const eventToAdd = {
      ...newEvent,
      id: uuidv4(),
    };
    
    setEvents(prev => [...prev, eventToAdd]);
    setNewEvent({
      id: '',
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      duration: 60,
      category: 'study',
      completed: false
    });
    setShowForm(false);
    setQuickAddMode(false);
    setClickedTimeSlot(null);
    
    // Add XP for creating a scheduled event
    addXP(5, 'timetable');
  };
  
  const quickAddEvent = () => {
    if (!newEvent.title) return;
    addEvent();
  };

  const toggleEventCompletion = (id) => {
    setEvents(prev => prev.map(event => {
      if (event.id === id) {
        const wasCompleted = event.completed;
        const newCompletionState = !wasCompleted;
        
        // Only award XP when changing from incomplete to complete
        if (newCompletionState && !wasCompleted) {
          addXP(15, 'timetable');
        }
        
        return { ...event, completed: newCompletionState };
      }
      return event;
    }));
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
  };
  
  // Function already defined elsewhere in the file

  const formatDate = (dateString) => {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const todayFormatted = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const selectedDateFormatted = () => {
    return `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  };

  const filteredEvents = () => {
    if (view === 'day') {
      return events.filter(event => event.date === selectedDateFormatted());
    } else if (view === 'week') {
      // Get start of week (Sunday)
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      
      // Get end of week (Saturday)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= startOfWeek && eventDate <= endOfWeek;
      });
    } else if (view === 'month') {
      // Get all events in the current month
      return events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === selectedDate.getMonth() && 
               eventDate.getFullYear() === selectedDate.getFullYear();
      });
    }
    return events;
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'study': return '#4285F4';
      case 'work': return '#EA4335';
      case 'personal': return '#FBBC05';
      case 'health': return '#34A853';
      default: return '#9AA0A6';
    }
  };

  return (
    <motion.div 
      className="component-container timetable-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="timetable-header">
        <h1>Timetable & Scheduling</h1>
        <div className="timetable-controls">
          <div className="view-controls">
            <button 
              className={view === 'day' ? 'active' : ''} 
              onClick={() => setView('day')}
            >
              Day
            </button>
            <button 
              className={view === 'week' ? 'active' : ''} 
              onClick={() => setView('week')}
            >
              Week
            </button>
            <button 
              className={view === 'month' ? 'active' : ''} 
              onClick={() => setView('month')}
            >
              Month
            </button>
          </div>
          <div className="date-controls">
            <button onClick={() => changeDate(-1)}>&lt;</button>
            <button onClick={() => setSelectedDate(new Date())}>Today</button>
            <button onClick={() => changeDate(1)}>&gt;</button>
          </div>
        </div>
        <h2>{formatDate(selectedDate)}</h2>
      </div>

      <div className="timetable-actions">
        <button 
          className="add-event-btn" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Event'}
        </button>
        <button 
          className="saved-tasks-btn" 
          onClick={() => setShowSavedTasksForm(!showSavedTasksForm)}
        >
          {showSavedTasksForm ? 'Hide Saved Tasks' : 'Saved Tasks'}
        </button>
      </div>
      
      {showSavedTasksForm && (
        <motion.div 
          className="saved-tasks-container"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3>Saved Tasks</h3>
          <form onSubmit={addSavedTask} className="saved-task-form">
            <input 
              type="text" 
              value={newSavedTask} 
              onChange={(e) => setNewSavedTask(e.target.value)}
              placeholder="Enter a task to save"
            />
            <button type="submit">Save</button>
          </form>
          <div className="saved-tasks-list">
            {savedTasks.length > 0 ? (
              savedTasks.map(task => (
                <div key={task.id} className="saved-task-item">
                  <span>{task.title}</span>
                  <div className="saved-task-actions">
                    <button onClick={() => useSavedTask(task.title)}>Use</button>
                    <button onClick={() => deleteSavedTask(task.id)}>Delete</button>
                  </div>
                </div>
              ))
            ) : (
              <p>No saved tasks yet. Add some for quick access!</p>
            )}
          </div>
        </motion.div>
      )}
      
      {showForm && (
        <motion.div 
          className="add-event-form"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <form onSubmit={addEvent}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Event Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="date">Date*</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={newEvent.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Start Time*</label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={newEvent.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={newEvent.endTime}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={newEvent.category}
                onChange={handleInputChange}
              >
                <option value="study">Study</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button type="submit" className="submit-btn">Add Event</button>
          </form>
        </motion.div>
      )}
      
      <div className="timetable-content">
        <div className="hourly-timetable">
          <div className="time-grid">
            <div className="time-grid-header">
              <div className="time-header">Time</div>
              <div className="event-header">Events</div>
            </div>
            <div className="time-grid-body">
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                const timeSlot = `${hour}:00`;
                const eventsInSlot = filteredEvents().filter(event => {
                  const eventHour = event.startTime.split(':')[0];
                  return eventHour === hour;
                });
                
                return (
                  <div 
                    key={timeSlot} 
                    className={`time-slot ${eventsInSlot.length > 0 ? 'has-events' : ''} ${clickedTimeSlot === hour ? 'selected' : ''}`}
                    onClick={() => handleTimeSlotClick(i)}
                  >
                    <div className="time-indicator">
                      <span>{timeSlot}</span>
                      {i < 23 && (
                        <>
                          <span className="time-quarter">:15</span>
                          <span className="time-half">:30</span>
                          <span className="time-quarter">:45</span>
                        </>
                      )}
                    </div>
                    <div className="slot-events">
                      {eventsInSlot.length > 0 ? (
                        eventsInSlot.map(event => {
                          // Calculate event position and height based on start time and duration
                          const startMinutes = parseInt(event.startTime.split(':')[1]);
                          const startPercent = (startMinutes / 60) * 100;
                          
                          // Calculate duration in minutes
                          let durationMinutes = 60; // Default
                          if (event.endTime) {
                            const [startHour, startMin] = event.startTime.split(':').map(Number);
                            const [endHour, endMin] = event.endTime.split(':').map(Number);
                            const startTotalMins = startHour * 60 + startMin;
                            const endTotalMins = endHour * 60 + endMin;
                            durationMinutes = endTotalMins - startTotalMins;
                            if (durationMinutes <= 0) durationMinutes = 60; // Fallback
                          }
                          
                          const heightPercent = Math.min((durationMinutes / 60) * 100, 100);
                          
                          return (
                            <div 
                              key={event.id} 
                              className={`event-block ${event.completed ? 'completed' : ''}`}
                              style={{ 
                                top: `${startPercent}%`,
                                height: `${heightPercent}%`,
                                backgroundColor: getCategoryColor(event.category),
                                opacity: event.completed ? 0.7 : 1
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEventCompletion(event.id);
                              }}
                            >
                              <div className="event-block-content">
                                <div className="event-title">{event.title}</div>
                                <div className="event-time">{event.startTime} - {event.endTime || 'N/A'}</div>
                                <div className="event-actions">
                                  <button 
                                    className="delete-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteEvent(event.id);
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {quickAddMode && (
            <motion.div 
              className="quick-add-form"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="quick-add-header">
                <h3>Quick Add Event at {newEvent.startTime}</h3>
                <button className="close-btn" onClick={() => {
                  setQuickAddMode(false);
                  setClickedTimeSlot(null);
                }}>×</button>
              </div>
              <div className="quick-add-content">
                <input
                  type="text"
                  placeholder="Event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  autoFocus
                />
                <div className="duration-selector">
                  <button 
                    className={newEvent.duration === 15 ? 'active' : ''}
                    onClick={() => handleDurationChange(15)}
                  >
                    15m
                  </button>
                  <button 
                    className={newEvent.duration === 30 ? 'active' : ''}
                    onClick={() => handleDurationChange(30)}
                  >
                    30m
                  </button>
                  <button 
                    className={newEvent.duration === 45 ? 'active' : ''}
                    onClick={() => handleDurationChange(45)}
                  >
                    45m
                  </button>
                  <button 
                    className={newEvent.duration === 60 ? 'active' : ''}
                    onClick={() => handleDurationChange(60)}
                  >
                    1h
                  </button>
                </div>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
                >
                  <option value="study">Study</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                  <option value="other">Other</option>
                </select>
                <button className="add-btn" onClick={quickAddEvent}>Add Event</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <h3>Events List</h3>
        <div className="events-list">
          {filteredEvents().length > 0 ? (
            filteredEvents()
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(event => (
                <motion.div 
                  key={event.id} 
                  className={`event-card ${event.completed ? 'completed' : ''}`}
                  style={{ borderLeftColor: getCategoryColor(event.category) }}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="event-header">
                    <h3>{event.title}</h3>
                    <span className="event-category">{event.category}</span>
                  </div>
                  <div className="event-time">
                    {event.startTime} - {event.endTime || 'N/A'}
                  </div>
                  <div className="event-actions">
                    <button 
                      className={`complete-btn ${event.completed ? 'completed' : ''}`}
                      onClick={() => toggleEventCompletion(event.id)}
                    >
                      {event.completed ? 'Completed' : 'Mark Complete'}
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteEvent(event.id)}
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))
          ) : (
            <div className="no-events">
              <p>No events scheduled for this {view}.</p>
            </div>
          )}
        </div>

        <button 
          className="add-event-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Event'}
        </button>

        {showForm && (
          <motion.form 
            className="event-form"
            onSubmit={addEvent}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="form-group">
              <label htmlFor="title">Event Title*</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newEvent.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">Date*</label>
              <input
                type="date"
                id="date"
                name="date"
                value={newEvent.date}
                onChange={handleInputChange}
                min={todayFormatted()}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Start Time*</label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={newEvent.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={newEvent.endTime}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={newEvent.category}
                onChange={handleInputChange}
              >
                <option value="study">Study</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button type="submit" className="submit-btn">Add Event</button>
          </motion.form>
        )}
      </div>
    </motion.div>
  );
};

export default Timetable;
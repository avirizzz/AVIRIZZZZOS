import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import '../styles/Dashboard.css';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title
);

const Dashboard = () => {
  // Get data from context
  const { 
    player, 
    habits, 
    academics, 
    goals, 
    books, 
    socialMedia,
    timetable 
  } = useAppContext();
  
  // Prepare stats for display
  const [playerStats, setPlayerStats] = useState({
    level: 1,
    title: '',
    totalXP: 0,
    nextLevelXP: 1000,
    habits: {
      completed: 0,
      total: 0,
      level: 1
    },
    hobbies: {
      active: 0,
      level: 1
    },
    academics: {
      subjects: 0,
      averageScore: 0,
      level: 1
    },
    goals: {
      completed: 0,
      inProgress: 0,
      level: 1
    },
    books: {
      reading: 0,
      completed: 0,
      level: 1
    },
    socialMedia: {
      disciplineLevel: 1,
      streakDays: 0
    },
    timetable: {
      level: 1,
      completed: 0,
      scheduled: 0
    }
  });
  
  // Update stats from context
  useEffect(() => {
    // Count completed habits
    const completedHabits = habits?.filter(habit => habit.completed)?.length || 0;
    
    // Calculate average habit level
    const avgHabitLevel = habits?.length > 0 
      ? Math.floor(habits.reduce((sum, habit) => sum + (habit.level || 1), 0) / habits.length) 
      : 1;
    
    // Update player stats
    setPlayerStats({
      level: player?.level || 1,
      title: player?.title || 'Novice',
      totalXP: player?.totalXP || 0,
      nextLevelXP: player?.nextLevelXP || 1000,
      habits: {
        completed: completedHabits,
        total: habits?.length || 0,
        level: avgHabitLevel
      },
      hobbies: {
        active: habits?.filter(h => h.type === 'hobby')?.length || 0,
        level: habits?.filter(h => h.type === 'hobby')?.length > 0 
          ? Math.floor(habits.filter(h => h.type === 'hobby').reduce((sum, h) => sum + (h.level || 1), 0) / habits.filter(h => h.type === 'hobby').length) 
          : 1
      },
      academics: {
        subjects: academics?.subjects?.length || 0,
        averageScore: academics?.averageScore || 0,
        level: academics?.overallLevel || 1
      },
      goals: {
        completed: goals?.weekly?.filter(goal => goal?.completed)?.length || 0,
        inProgress: goals?.weekly?.filter(goal => !goal?.completed)?.length || 0,
        level: goals?.overallLevel || 1
      },
      books: {
        reading: books?.reading?.length || 0,
        completed: books?.completed?.length || 0,
        level: books?.overallLevel || 1
      },
      socialMedia: {
        disciplineLevel: socialMedia?.disciplineLevel || 1,
        streakDays: socialMedia?.streakDays || 0
      },
      timetable: {
        level: timetable?.overallLevel || 1,
        completed: 0, // Would need to calculate from events
        scheduled: 0  // Would need to calculate from events
      }
    });
  }, [player, habits, academics, goals, books, socialMedia, timetable]);

  // Calculate XP percentage for progress bar
  const xpPercentage = (playerStats.totalXP / playerStats.nextLevelXP) * 100;

  // Prepare chart data
  const levelComparisonData = {
    labels: ['Habits', 'Academics', 'Goals', 'Books', 'Social Media', 'Timetable'],
    datasets: [
      {
        label: 'Level',
        data: [
          playerStats.habits.level,
          playerStats.academics.level,
          playerStats.goals.level,
          playerStats.books.level,
          playerStats.socialMedia.disciplineLevel,
          playerStats.timetable.level
        ],
        backgroundColor: [
          'rgba(76, 201, 240, 0.6)',
          'rgba(114, 9, 183, 0.6)',
          'rgba(58, 12, 163, 0.6)',
          'rgba(67, 97, 238, 0.6)',
          'rgba(72, 149, 239, 0.6)',
          'rgba(247, 37, 133, 0.6)'
        ],
        borderColor: [
          'rgba(76, 201, 240, 1)',
          'rgba(114, 9, 183, 1)',
          'rgba(58, 12, 163, 1)',
          'rgba(67, 97, 238, 1)',
          'rgba(72, 149, 239, 1)',
          'rgba(247, 37, 133, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Weekly activity data (mock data for demonstration)
  const weeklyActivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'XP Earned',
        data: [120, 190, 30, 250, 180, 80, 150],
        borderColor: 'rgba(76, 201, 240, 1)',
        backgroundColor: 'rgba(76, 201, 240, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  };
  
  // Completion rate data
  const completionRateData = {
    labels: ['Habits', 'Goals', 'Books'],
    datasets: [
      {
        label: 'Completion Rate',
        data: [
          playerStats.habits.total > 0 ? (playerStats.habits.completed / playerStats.habits.total) * 100 : 0,
          (playerStats.goals.completed + playerStats.goals.inProgress) > 0 ? 
            (playerStats.goals.completed / (playerStats.goals.completed + playerStats.goals.inProgress)) * 100 : 0,
          (playerStats.books.reading + playerStats.books.completed) > 0 ? 
            (playerStats.books.completed / (playerStats.books.reading + playerStats.books.completed)) * 100 : 0
        ],
        backgroundColor: [
          'rgba(76, 201, 240, 0.8)',
          'rgba(58, 12, 163, 0.8)',
          'rgba(67, 97, 238, 0.8)'
        ]
      }
    ]
  };

  return (
    <div className="dashboard-container">
      <motion.div 
        className="player-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="player-header">
          <div className="player-avatar">
            {/* Placeholder for avatar */}
            <div className="avatar-placeholder">AV</div>
          </div>
          <div className="player-info">
            <h2>AVIRIZZZ</h2>
            <div className="player-title">{playerStats.title}</div>
            <div className="level-badge">Level {playerStats.level}</div>
          </div>
        </div>
        
        <div className="xp-progress">
          <div className="xp-bar">
            <motion.div 
              className="xp-fill"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1 }}
            ></motion.div>
          </div>
          <div className="xp-text">
            {playerStats.totalXP} / {playerStats.nextLevelXP} XP
          </div>
        </div>
      </motion.div>
      
      {/* Charts Section */}
      <div className="charts-section">
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3>Level Comparison</h3>
          <div className="chart-container">
            <Bar 
              data={levelComparisonData} 
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#f8f9fa' }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: '#f8f9fa' }
                  }
                }
              }}
            />
          </div>
        </motion.div>
        
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3>Weekly Activity</h3>
          <div className="chart-container">
            <Line 
              data={weeklyActivityData}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#f8f9fa' }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: '#f8f9fa' }
                  }
                }
              }}
            />
          </div>
        </motion.div>
        
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3>Completion Rates (%)</h3>
          <div className="chart-container doughnut-container">
            <Doughnut 
              data={completionRateData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#f8f9fa' }
                  }
                },
                cutout: '70%'
              }}
            />
          </div>
        </motion.div>
      </div>

      <div className="stats-grid">
        <motion.div 
          className="stat-card habits"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3>Habits & Routines</h3>
          <div className="stat-level">Level {playerStats.habits.level}</div>
          <div className="stat-progress">
            <span>{playerStats.habits.completed}/{playerStats.habits.total} Completed</span>
            <div className="progress-bar">
              <motion.div 
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(playerStats.habits.completed / playerStats.habits.total) * 100}%` }}
                transition={{ duration: 0.8 }}
              ></motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card hobbies"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h3>Hobbies</h3>
          <div className="stat-level">Level {playerStats.hobbies.level}</div>
          <div className="stat-detail">
            <span>{playerStats.hobbies.active} Active Hobbies</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card academics"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h3>Academics</h3>
          <div className="stat-level">Level {playerStats.academics.level}</div>
          <div className="stat-detail">
            <span>{playerStats.academics.subjects} Subjects</span>
            <span>Avg: {playerStats.academics.averageScore}%</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card goals"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h3>Goals</h3>
          <div className="stat-level">Level {playerStats.goals.level}</div>
          <div className="stat-detail">
            <span>{playerStats.goals.completed} Completed</span>
            <span>{playerStats.goals.inProgress} In Progress</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card books"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <h3>Books</h3>
          <div className="stat-level">Level {playerStats.books.level}</div>
          <div className="stat-detail">
            <span>{playerStats.books.reading} Reading</span>
            <span>{playerStats.books.completed} Completed</span>
          </div>
        </motion.div>

        <motion.div 
          className="stat-card social-media"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <h3>Social Media Discipline</h3>
          <div className="stat-level">Level {playerStats.socialMedia.disciplineLevel}</div>
          <div className="stat-detail">
            <span>{playerStats.socialMedia.streakDays} Day Streak</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
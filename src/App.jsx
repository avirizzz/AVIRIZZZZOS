import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import HabitTracker from './components/HabitTracker';
import Timetable from './components/Timetable';
import Academics from './components/Academics';
import Goals from './components/Goals';
import Books from './components/Books';
import SocialMedia from './components/SocialMedia';
import Profile from './components/Profile';
import VideoBackground from './components/VideoBackground';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <VideoBackground />
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/habits" element={<HabitTracker />} />
            {/* Additional routes will be added as components are developed */}
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/academics" element={<Academics />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/books" element={<Books />} />
            <Route path="/social-media" element={<SocialMedia />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

import React, { useState, useContext } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user } = useContext(AppContext) || {};
  const [isOpen, setIsOpen] = useState(false);

  const toggleNav = () => {
    setIsOpen(!isOpen);
  };

  const closeNav = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button className="nav-toggle" onClick={toggleNav}>
        {isOpen ? '×' : '☰'}
      </button>
      
      <motion.nav 
        className={`navbar ${isOpen ? 'open' : ''}`}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="nav-content">
          <div className="nav-logo">
            <Link to="/">
              <h1>AVIRIZZZ OS</h1>
            </Link>
          </div>
          <div className="nav-links">
            <NavLink to="/dashboard" className="nav-link" onClick={closeNav}>Dashboard</NavLink>
            <NavLink to="/habits" className="nav-link" onClick={closeNav}>Habits & Hobbies</NavLink>
            <NavLink to="/timetable" className="nav-link" onClick={closeNav}>Timetable</NavLink>
            <NavLink to="/academics" className="nav-link" onClick={closeNav}>Academics</NavLink>
            <NavLink to="/goals" className="nav-link" onClick={closeNav}>Goals</NavLink>
            <NavLink to="/books" className="nav-link" onClick={closeNav}>Books</NavLink>
            <NavLink to="/social" className="nav-link" onClick={closeNav}>Social Media</NavLink>
            <NavLink to="/login" className="nav-link" onClick={closeNav}>{user ? 'Profile' : 'Login'}</NavLink>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
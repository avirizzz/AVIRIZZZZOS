import { useState } from 'react';

/**
 * Custom hook for managing XP and level progression
 * @param {Object} options - Configuration options
 * @param {number} options.initialLevel - Starting level (default: 1)
 * @param {number} options.initialXP - Starting XP (default: 0)
 * @param {number} options.initialNextLevelXP - XP required for next level (default: 100)
 * @param {number} options.xpMultiplier - Multiplier for next level XP calculation (default: 1.5)
 * @returns {Object} XP system methods and state
 */
const useXPSystem = (options = {}) => {
  const {
    initialLevel = 1,
    initialXP = 0,
    initialNextLevelXP = 100,
    xpMultiplier = 1.5
  } = options;

  const [level, setLevel] = useState(initialLevel);
  const [xp, setXP] = useState(initialXP);
  const [nextLevelXP, setNextLevelXP] = useState(initialNextLevelXP);

  /**
   * Add XP and handle level up if necessary
   * @param {number} amount - Amount of XP to add
   * @returns {Object} - Level up information
   */
  const addXP = (amount) => {
    let newXP = xp + amount;
    let newLevel = level;
    let didLevelUp = false;
    let xpForNextLevel = nextLevelXP;
    
    // Handle level up
    if (newXP >= nextLevelXP) {
      newLevel += 1;
      newXP -= nextLevelXP;
      xpForNextLevel = Math.floor(nextLevelXP * xpMultiplier);
      didLevelUp = true;
      
      setLevel(newLevel);
      setNextLevelXP(xpForNextLevel);
    }
    
    setXP(newXP);
    
    return {
      didLevelUp,
      newLevel,
      newXP,
      nextLevelXP: xpForNextLevel
    };
  };

  /**
   * Remove XP and handle level down if necessary
   * @param {number} amount - Amount of XP to remove
   * @returns {Object} - Level down information
   */
  const removeXP = (amount) => {
    let newXP = xp - amount;
    let newLevel = level;
    let didLevelDown = false;
    
    // Handle negative XP (level down)
    if (newXP < 0 && level > 1) {
      newLevel -= 1;
      didLevelDown = true;
      
      // Calculate previous level XP requirement
      const prevLevelXP = Math.floor(nextLevelXP / xpMultiplier);
      newXP = prevLevelXP + newXP; // newXP is negative here
      
      setLevel(newLevel);
      setNextLevelXP(prevLevelXP);
    } else if (newXP < 0) {
      // Don't go below 0 XP at level 1
      newXP = 0;
    }
    
    setXP(newXP);
    
    return {
      didLevelDown,
      newLevel,
      newXP,
      nextLevelXP
    };
  };

  /**
   * Calculate percentage progress to next level
   * @returns {number} - Percentage (0-100)
   */
  const getProgressPercentage = () => {
    return (xp / nextLevelXP) * 100;
  };

  /**
   * Reset XP system to initial values
   */
  const reset = () => {
    setLevel(initialLevel);
    setXP(initialXP);
    setNextLevelXP(initialNextLevelXP);
  };

  return {
    level,
    xp,
    nextLevelXP,
    addXP,
    removeXP,
    getProgressPercentage,
    reset
  };
};

export default useXPSystem;
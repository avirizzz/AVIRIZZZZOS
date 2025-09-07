/**
 * Utility functions for level calculations and titles
 */

/**
 * Get player title based on level
 * @param {number} level - Player level
 * @returns {string} - Title corresponding to level
 */
export const getPlayerTitle = (level) => {
  const titles = {
    1: 'Noob Idiot',
    2: 'Beginner Adventurer',
    3: 'Casual Explorer',
    4: 'Dedicated Learner',
    5: 'Novice Explorer',
    6: 'Skilled Practitioner',
    7: 'Veteran Achiever',
    8: 'Master Specialist',
    9: 'Elite Performer',
    10: 'GOATED'
  };

  // Handle levels beyond our defined titles
  if (level > 10) return 'GOATED';
  if (level < 1) return 'Noob Idiot';

  return titles[level] || 'Unknown';
};

/**
 * Calculate XP required for next level
 * @param {number} currentLevel - Current level
 * @param {number} baseXP - Base XP for level 1 (default: 100)
 * @param {number} multiplier - Growth multiplier (default: 1.5)
 * @returns {number} - XP required for next level
 */
export const calculateNextLevelXP = (currentLevel, baseXP = 100, multiplier = 1.5) => {
  return Math.floor(baseXP * Math.pow(multiplier, currentLevel - 1));
};

/**
 * Calculate total XP required to reach a specific level
 * @param {number} targetLevel - Target level
 * @param {number} baseXP - Base XP for level 1 (default: 100)
 * @param {number} multiplier - Growth multiplier (default: 1.5)
 * @returns {number} - Total XP required
 */
export const calculateTotalXPForLevel = (targetLevel, baseXP = 100, multiplier = 1.5) => {
  let totalXP = 0;
  
  for (let level = 1; level < targetLevel; level++) {
    totalXP += calculateNextLevelXP(level, baseXP, multiplier);
  }
  
  return totalXP;
};

/**
 * Get color theme for a specific level
 * @param {number} level - Current level
 * @returns {Object} - Color theme object with primary and secondary colors
 */
export const getLevelColorTheme = (level) => {
  const themes = [
    { primary: '#4361ee', secondary: '#4cc9f0' }, // Level 1
    { primary: '#3a0ca3', secondary: '#4361ee' }, // Level 2
    { primary: '#7209b7', secondary: '#3a0ca3' }, // Level 3
    { primary: '#f72585', secondary: '#7209b7' }, // Level 4
    { primary: '#4cc9f0', secondary: '#4361ee' }, // Level 5
    { primary: '#4361ee', secondary: '#3a0ca3' }, // Level 6
    { primary: '#7209b7', secondary: '#f72585' }, // Level 7
    { primary: '#f72585', secondary: '#4cc9f0' }, // Level 8
    { primary: '#3a0ca3', secondary: '#4cc9f0' }, // Level 9
    { primary: '#f72585', secondary: '#4361ee' }  // Level 10
  ];
  
  const index = Math.min(Math.max(level - 1, 0), themes.length - 1);
  return themes[index];
};

/**
 * Generate a motivational message for level up
 * @param {number} newLevel - New level achieved
 * @returns {string} - Motivational message
 */
export const getLevelUpMessage = (newLevel) => {
  const messages = [
    'You leveled up! Keep pushing forward!',
    'Level up! You\'re making great progress!',
    'Congratulations on reaching the next level!',
    'You\'re unstoppable! Another level conquered!',
    'Level up! Your dedication is paying off!',
    'Amazing work! You\'ve reached a new milestone!',
    'You\'re on fire! Keep that momentum going!',
    'Level up! You\'re becoming a master!',
    'Incredible achievement! New level unlocked!',
    'GOATED STATUS ACHIEVED! You\'re legendary!'
  ];
  
  const index = Math.min(Math.max(newLevel - 1, 0), messages.length - 1);
  return messages[index];
};
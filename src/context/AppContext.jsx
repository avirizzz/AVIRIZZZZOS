import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

// Create context
export const AppContext = createContext();

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);

// Firebase configuration
// IMPORTANT: Replace these placeholder values with your actual Firebase config
// You can find these values in your Firebase project settings
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase when config is provided
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

try {
  // Only initialize if apiKey is set to a real value
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } else {
    console.log("Firebase not initialized: Configuration not provided");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Add this after the Firebase initialization
const handleFirebaseError = (error) => {
  console.error('Firebase operation failed:', error);
  // You might want to add toast notifications here
  throw error;
};

// Provider component
export const AppProvider = ({ children }) => {
  // User authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Player state
  const [player, setPlayer] = useState({
    name: 'AVIRIZZZ',
    level: 1,
    title: 'Noob Idiot',
    totalXP: 0,
    nextLevelXP: 1000,
  });
  
  // Timetable state
  const [timetable, setTimetable] = useState({
    overallLevel: 1,
    totalXP: 0,
    nextLevelXP: 500
  });

  // Habits state
  const [habits, setHabits] = useState([]);
  
  // Hobbies state
  const [hobbies, setHobbies] = useState([]);
  
  // Academics state
  const [academics, setAcademics] = useState({
    subjects: [],
    overallLevel: 1,
    totalXP: 0,
    nextLevelXP: 500
  });
  
  // Goals state
  const [goals, setGoals] = useState({
    weekly: [],
    monthly: [],
    overallLevel: 1,
    totalXP: 0,
    nextLevelXP: 500
  });
  
  // Books state
  const [books, setBooks] = useState({
    reading: [],
    completed: [],
    overallLevel: 1,
    totalXP: 0,
    nextLevelXP: 500
  });
  
  // Social media state
  const [socialMedia, setSocialMedia] = useState({
    dailyUsage: 0,
    limit: 120, // in minutes
    disciplineLevel: 1,
    streakDays: 0,
    totalXP: 0,
    nextLevelXP: 500
  });

  // Add these state variables
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firebase auth state observer
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
        
        // If user is logged in, fetch their data
        if (currentUser) {
          fetchUserData(currentUser.uid);
        }
      });
      
      return () => unsubscribe();
    } else {
      setAuthLoading(false);
    }
  }, []);
  
  // Fetch user data from Firestore
  const fetchUserData = async (userId) => {
    if (!db) return;
    
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        Object.entries(userData).forEach(([key, value]) => {
          if (value && typeof value === 'object') {
            switch(key) {
              case 'player': setPlayer(value); break;
              case 'habits': setHabits(value); break;
              case 'hobbies': setHobbies(value); break;
              case 'academics': setAcademics(value); break;
              case 'goals': setGoals(value); break;
              case 'books': setBooks(value); break;
              case 'socialMedia': setSocialMedia(value); break;
              case 'timetable': setTimetable(value); break;
            }
          }
        });
      }
    } catch (error) {
      handleFirebaseError(error);
    }
  };
  
  // Save user data to Firestore
  const saveUserData = async () => {
    if (!db || !user) return;
    
    try {
      const userDocRef = doc(db, "users", user.uid);
      
      await setDoc(userDocRef, {
        player,
        habits,
        hobbies,
        academics,
        goals,
        books,
        socialMedia,
        timetable,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log("User data saved successfully");
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };
  
  // Save data whenever state changes and user is authenticated
  useEffect(() => {
    let timeoutId;
    
    if (user) {
      // Debounce save operations
      timeoutId = setTimeout(() => {
        saveUserData();
      }, 1000); // Wait 1 second after last change before saving
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [player, habits, hobbies, academics, goals, books, socialMedia, timetable]);
  
  // Authentication functions
  const signup = async (email, password, displayName) => {
    if (!auth) throw new Error("Firebase not initialized");
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName });
      
      // Create user document in Firestore
      if (db) {
        const userDocRef = doc(db, "users", userCredential.user.uid);
        await setDoc(userDocRef, {
          email,
          displayName,
          createdAt: new Date(),
          player,
          habits: [],
          hobbies: [],
          academics,
          goals,
          books,
          socialMedia,
          timetable
        });
      }
      
      return userCredential.user;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };
  
  const login = async (email, password) => {
    if (!auth) throw new Error("Firebase not initialized");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  };
  
  // Update the logout function
  const logout = async () => {
    if (!auth) throw new Error("Firebase not initialized");
    
    setIsLoading(true);
    try {
      await signOut(auth);
      // Clear all state
      setUser(null);
      setPlayer({
        name: 'AVIRIZZZ',
        level: 1,
        title: 'Noob Idiot',
        totalXP: 0,
        nextLevelXP: 1000,
      });
      setHabits([]);
      setHobbies([]);
      setAcademics({ subjects: [], overallLevel: 1, totalXP: 0, nextLevelXP: 500 });
      setGoals({ weekly: [], monthly: [], overallLevel: 1, totalXP: 0, nextLevelXP: 500 });
      setBooks({ reading: [], completed: [], overallLevel: 1, totalXP: 0, nextLevelXP: 500 });
      setSocialMedia({ dailyUsage: 0, limit: 120, disciplineLevel: 1, streakDays: 0, totalXP: 0, nextLevelXP: 500 });
      setTimetable({ overallLevel: 1, totalXP: 0, nextLevelXP: 500 });
      localStorage.clear(); // Clear any local storage
    } catch (error) {
      handleFirebaseError(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateUserProfile = async (updates) => {
    if (!auth || !auth.currentUser) throw new Error("Not authenticated");
    
    try {
      await updateProfile(auth.currentUser, updates);
      
      // Update user state
      setUser({ ...auth.currentUser });
      
      // Update Firestore if needed
      if (db && (updates.displayName || updates.photoURL)) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userDocRef, {
          displayName: updates.displayName || auth.currentUser.displayName,
          photoURL: updates.photoURL || auth.currentUser.photoURL
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };
  
  // Calculate overall player level based on all activities
  useEffect(() => {
    const calculateOverallLevel = () => {
      // Calculate weighted average of all component levels
      const academicsWeight = 1.0;
      const goalsWeight = 1.0;
      const booksWeight = 1.0;
      const socialWeight = 1.0;
      const timetableWeight = 1.0;
      
      // Calculate average habit level
      const habitsAvgLevel = habits.length > 0 
        ? habits.reduce((sum, habit) => sum + habit.level, 0) / habits.length 
        : 1;
      
      // Calculate weighted average of all component levels
      const componentLevels = [
        { level: academics.overallLevel, weight: academicsWeight },
        { level: goals.overallLevel, weight: goalsWeight },
        { level: books.overallLevel, weight: booksWeight },
        { level: socialMedia.disciplineLevel, weight: socialWeight },
        { level: timetable.overallLevel, weight: timetableWeight },
        { level: habitsAvgLevel, weight: 1.0 }
      ];
      
      const totalWeight = componentLevels.reduce((sum, item) => sum + item.weight, 0);
      const weightedLevelSum = componentLevels.reduce((sum, item) => sum + (item.level * item.weight), 0);
      
      // Calculate overall level (rounded down)
      const calculatedLevel = Math.floor(weightedLevelSum / totalWeight);
      const totalLevel = Math.max(1, calculatedLevel); // Ensure minimum level is 1
      
      // Determine title based on level
      let title = 'Noob Idiot';
      
      if (totalLevel >= 10) {
        title = 'GOATED';
      } else if (totalLevel >= 7) {
        title = 'Master Achiever';
      } else if (totalLevel >= 5) {
        title = 'Skilled Tracker';
      } else if (totalLevel >= 3) {
        title = 'Novice Explorer';
      } else if (totalLevel >= 2) {
        title = 'Beginner Adventurer';
      }
      
      // Update player level and title
      setPlayer(prev => ({
        ...prev,
        level: totalLevel,
        title: title
      }));
    };
    
    calculateOverallLevel();
  }, [habits, hobbies, academics, goals, books, socialMedia, timetable]);

  // Add a new habit
  const addHabit = (name) => {
    const newHabit = {
      id: uuidv4(),
      name,
      level: 1,
      xp: 0,
      nextLevelXP: 100,
      streak: 0,
      completed: false,
      history: []
    };
    
    setHabits(prev => [...prev, newHabit]);
  };

  // Add a new hobby
  const addHobby = (name) => {
    const newHobby = {
      id: uuidv4(),
      name,
      level: 1,
      xp: 0,
      nextLevelXP: 100,
      streak: 0,
      completed: false,
      history: []
    };
    
    setHobbies(prev => [...prev, newHobby]);
  };

  // Complete a habit or hobby
  const completeActivity = (id, type) => {
    if (type === 'habit') {
      setHabits(prev => prev.map(habit => {
        if (habit.id === id) {
          const newXP = habit.xp + 20;
          const newStreak = habit.streak + 1;
          let newLevel = habit.level;
          let xpRemaining = newXP;
          let nextLevelXP = habit.nextLevelXP;
          
          // Level up if XP threshold reached
          if (newXP >= habit.nextLevelXP) {
            newLevel += 1;
            xpRemaining = newXP - habit.nextLevelXP;
            nextLevelXP = Math.floor(habit.nextLevelXP * 1.5);
            
            // Update player XP when leveling up
            setPlayer(prev => ({
              ...prev,
              totalXP: prev.totalXP + 50
            }));
          }
          
          return {
            ...habit,
            xp: xpRemaining,
            level: newLevel,
            nextLevelXP,
            streak: newStreak,
            completed: true,
            history: [...habit.history, { date: new Date(), completed: true }]
          };
        }
        return habit;
      }));
    } else if (type === 'hobby') {
      setHobbies(prev => prev.map(hobby => {
        if (hobby.id === id) {
          const newXP = hobby.xp + 30;
          const newStreak = hobby.streak + 1;
          let newLevel = hobby.level;
          let xpRemaining = newXP;
          let nextLevelXP = hobby.nextLevelXP;
          
          // Level up if XP threshold reached
          if (newXP >= hobby.nextLevelXP) {
            newLevel += 1;
            xpRemaining = newXP - hobby.nextLevelXP;
            nextLevelXP = Math.floor(hobby.nextLevelXP * 1.5);
            
            // Update player XP when leveling up
            setPlayer(prev => ({
              ...prev,
              totalXP: prev.totalXP + 75
            }));
          }
          
          return {
            ...hobby,
            xp: xpRemaining,
            level: newLevel,
            nextLevelXP,
            streak: newStreak,
            completed: true,
            history: [...hobby.history, { date: new Date(), completed: true }]
          };
        }
        return hobby;
      }));
    }
  };

  // Delete a habit or hobby
  const deleteActivity = (id, type) => {
    if (type === 'habit') {
      setHabits(prev => prev.filter(habit => habit.id !== id));
    } else if (type === 'hobby') {
      setHobbies(prev => prev.filter(hobby => hobby.id !== id));
    }
  };

  // Add XP to specific category and update levels
  const addXP = (amount, category) => {
    // Update player's total XP
    setPlayer(prev => ({
      ...prev,
      totalXP: prev.totalXP + amount
    }));
    
    // Update category-specific XP and check for level up
    switch(category) {
      case 'academics':
        setAcademics(prev => {
          const newXP = prev.totalXP + amount;
          let newLevel = prev.overallLevel;
          let newNextLevelXP = prev.nextLevelXP;
          
          // Check for level up
          if (newXP >= prev.nextLevelXP) {
            newLevel += 1;
            newNextLevelXP = Math.floor(prev.nextLevelXP * 1.5);
          }
          
          return {
            ...prev,
            totalXP: newXP,
            overallLevel: newLevel,
            nextLevelXP: newNextLevelXP
          };
        });
        break;
      case 'goals':
        setGoals(prev => {
          const newXP = prev.totalXP + amount;
          let newLevel = prev.overallLevel;
          let newNextLevelXP = prev.nextLevelXP;
          
          // Check for level up
          if (newXP >= prev.nextLevelXP) {
            newLevel += 1;
            newNextLevelXP = Math.floor(prev.nextLevelXP * 1.5);
          }
          
          return {
            ...prev,
            totalXP: newXP,
            overallLevel: newLevel,
            nextLevelXP: newNextLevelXP
          };
        });
        break;
      case 'books':
        setBooks(prev => {
          const newXP = prev.totalXP + amount;
          let newLevel = prev.overallLevel;
          let newNextLevelXP = prev.nextLevelXP;
          
          // Check for level up
          if (newXP >= prev.nextLevelXP) {
            newLevel += 1;
            newNextLevelXP = Math.floor(prev.nextLevelXP * 1.5);
          }
          
          return {
            ...prev,
            totalXP: newXP,
            overallLevel: newLevel,
            nextLevelXP: newNextLevelXP
          };
        });
        break;
      case 'social':
        setSocialMedia(prev => {
          const newXP = prev.totalXP + amount;
          let newLevel = prev.disciplineLevel;
          let newNextLevelXP = prev.nextLevelXP;
          
          // Check for level up
          if (newXP >= prev.nextLevelXP) {
            newLevel += 1;
            newNextLevelXP = Math.floor(prev.nextLevelXP * 1.5);
          }
          
          return {
            ...prev,
            totalXP: newXP,
            disciplineLevel: newLevel,
            nextLevelXP: newNextLevelXP
          };
        });
        break;
      case 'timetable':
        // Create a timetable state if it doesn't exist yet
        if (!timetable) {
          setTimetable({
            overallLevel: 1,
            totalXP: amount,
            nextLevelXP: 500
          });
        } else {
          setTimetable(prev => {
            const newXP = prev.totalXP + amount;
            let newLevel = prev.overallLevel;
            let newNextLevelXP = prev.nextLevelXP;
            
            // Check for level up
            if (newXP >= prev.nextLevelXP) {
              newLevel += 1;
              newNextLevelXP = Math.floor(prev.nextLevelXP * 1.5);
            }
            
            return {
              ...prev,
              totalXP: newXP,
              overallLevel: newLevel,
              nextLevelXP: newNextLevelXP
            };
          });
        }
        break;
      default:
        // Just add to player XP if no specific category
        break;
    }
  };

  // Context value
  const value = {
    // User authentication
    user,
    authLoading,
    signup,
    login,
    logout,
    updateUserProfile,
    // Player data
    player,
    habits,
    hobbies,
    academics,
    goals,
    books,
    socialMedia,
    timetable,
    addHabit,
    addHobby,
    completeActivity,
    deleteActivity,
    addXP,
    // Loading and error states
    isLoading,
    error,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
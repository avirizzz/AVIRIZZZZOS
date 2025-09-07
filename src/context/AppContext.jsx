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
  updateDoc
} from 'firebase/firestore';

// Create context
export const AppContext = createContext();

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app, auth, db;

const initializeFirebase = () => {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase configuration is not set");
  }
};

initializeFirebase();

export { db };

const handleFirebaseError = (error) => {
  console.error('Firebase operation failed:', error);
  throw error;
};

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
  
  const [timetable, setTimetable] = useState({
    overallLevel: 1,
    totalXP: 0,
    nextLevelXP: 500
  });

  const [habits, setHabits] = useState([]);
  const [hobbies, setHobbies] = useState([]);

  const [academics, setAcademics] = useState({
    subjects: [],
    overallLevel: 1,
    totalXP: 0,
    nextLevelXP: 500
  });
  
  const [goals, setGoals] = useState({
    weekly: [],
    monthly: [],
    overallLevel: 1,
    totalXP: 0,
    nextLevelXP: 500
  });
  
  const [books, setBooks] = useState({
    reading: [],
    completed: [],
    overallLevel: 1,
    totalXP: 0,
    nextLevelXP: 500
  });
  
  const [socialMedia, setSocialMedia] = useState({
    dailyUsage: 0,
    limit: 120,
    disciplineLevel: 1,
    streakDays: 0,
    totalXP: 0,
    nextLevelXP: 500
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auth observer
  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
        
        if (currentUser) {
          fetchUserData(currentUser.uid);
        }
      });
      return () => unsubscribe();
    } else {
      setAuthLoading(false);
    }
  }, []);

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

  // Auto save, only when user is logged in
  useEffect(() => {
    if (!user) return;
    let timeoutId = setTimeout(() => {
      saveUserData();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [user, player, habits, hobbies, academics, goals, books, socialMedia, timetable]);

  // Auth functions
  const signup = async (email, password, displayName) => {
    if (!auth) throw new Error("Firebase not initialized");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
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

  const logout = async () => {
    if (!auth) throw new Error("Firebase not initialized");
    setIsLoading(true);
    try {
      await signOut(auth);

      // Clear user first so autosave won’t run with empty state
      setUser(null);

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
      setUser({ ...auth.currentUser });
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

  // Calculate overall player level
  useEffect(() => {
    const calculateOverallLevel = () => {
      const academicsWeight = 1.0;
      const goalsWeight = 1.0;
      const booksWeight = 1.0;
      const socialWeight = 1.0;
      const timetableWeight = 1.0;
      const habitsAvgLevel = habits.length > 0 
        ? habits.reduce((sum, habit) => sum + habit.level, 0) / habits.length 
        : 1;
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
      const calculatedLevel = Math.floor(weightedLevelSum / totalWeight);
      const totalLevel = Math.max(1, calculatedLevel);
      let title = 'Noob Idiot';
      if (totalLevel >= 10) title = 'GOATED';
      else if (totalLevel >= 7) title = 'Master Achiever';
      else if (totalLevel >= 5) title = 'Skilled Tracker';
      else if (totalLevel >= 3) title = 'Novice Explorer';
      else if (totalLevel >= 2) title = 'Beginner Adventurer';
      setPlayer(prev => ({ ...prev, level: totalLevel, title }));
    };
    calculateOverallLevel();
  }, [habits, hobbies, academics, goals, books, socialMedia, timetable]);

  // Add new habit
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

  // Add new hobby
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

  // Complete activity
  const completeActivity = (id, type) => {
    if (type === 'habit') {
      setHabits(prev => prev.map(habit => {
        if (habit.id === id) {
          const newXP = habit.xp + 20;
          const newStreak = habit.streak + 1;
          let newLevel = habit.level;
          let xpRemaining = newXP;
          let nextLevelXP = habit.nextLevelXP;
          if (newXP >= habit.nextLevelXP) {
            newLevel += 1;
            xpRemaining = newXP - habit.nextLevelXP;
            nextLevelXP = Math.floor(habit.nextLevelXP * 1.5);
            setPlayer(prev => ({ ...prev, totalXP: prev.totalXP + 50 }));
          }
          return { ...habit, xp: xpRemaining, level: newLevel, nextLevelXP, streak: newStreak, completed: true, history: [...habit.history, { date: new Date(), completed: true }] };
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
          if (newXP >= hobby.nextLevelXP) {
            newLevel += 1;
            xpRemaining = newXP - hobby.nextLevelXP;
            nextLevelXP = Math.floor(hobby.nextLevelXP * 1.5);
            setPlayer(prev => ({ ...prev, totalXP: prev.totalXP + 75 }));
          }
          return { ...hobby, xp: xpRemaining, level: newLevel, nextLevelXP, streak: newStreak, completed: true, history: [...hobby.history, { date: new Date(), completed: true }] };
        }
        return hobby;
      }));
    }
  };

  const deleteActivity = (id, type) => {
    if (type === 'habit') setHabits(prev => prev.filter(habit => habit.id !== id));
    else if (type === 'hobby') setHobbies(prev => prev.filter(hobby => hobby.id !== id));
  };

  const addXP = (amount, category) => {
    setPlayer(prev => ({ ...prev, totalXP: prev.totalXP + amount }));
    switch(category) {
      case 'academics':
        setAcademics(prev => {
          const newXP = prev.totalXP + amount;
          let newLevel = prev.overallLevel;
          let newNextLevelXP = prev.nextLevelXP;
          if (newXP >= prev.nextLevelXP) {
            newLevel += 1;
            newNextLevelXP = Math.floor(prev.nextLevelXP * 1.5);
          }
          return { ...prev, totalXP: newXP, overallLevel: newLevel, nextLevelXP: newNextLevelXP };
        });
        break;
      case 'goals':
        setGoals(prev => {
          const newXP = prev.totalXP + amount;
          let newLevel = prev.overallLevel;
          let newNextLevelXP = prev.nextLevelXP;
          if (newXP >= prev.nextLevelXP) {
            newLevel += 1;
            newNextLevelXP = Math.floor(prev.nextLevelXP * 1.5);
          }
          return { ...prev, totalXP: newXP, overallLevel: newLevel, nextLevelXP: newNextLevelXP };
        });
        break;
      case 'books':
        setBooks(prev => {
          const newXP = prev.totalXP + amount;
          let newLevel = prev.overallLevel;
          let newNextLevelXP = prev.nextLevelXP;
          if (newXP >= prev.nextLevelXP) {
            newLevel += 1;
            newNextLevelXP = Math.floor(prev.nextLevelXP * 1.5);
          }
          return { ...prev, totalXP: newXP, overallLevel: newLevel, nextLevelXP: newNextLevelXP };
        });
        break;
      case 'social':
        setSocialMedia(prev => {
          const newXP = prev.totalXP + amount;
          let newLevel = prev.disciplineLevel;
          let newNextLevelXP = prev.nextLevelXP;
          if (newXP >= prev.nextLevelXP) {
            newLevel += 1;
            newNextLevelXP = Math.floor(prev.nextLevelXP * 1.5);
          }
          return { ...prev, totalXP: newXP, disciplineLevel: newLevel, nextLevelXP: newNextLevelXP };
        });
        break;
      case 'timetable':
        setTimetable(prev => {
          const newXP = prev.totalXP + amount;
          let newLevel = prev.overallLevel;
          let newNextLevelXP = prev.nextLevelXP;
          if (newXP >= prev.nextLevelXP) {
            newLevel += 1;
            newNextLevelXP = Math.floor(prev.nextLevelXP * 1.5);
          }
          return { ...prev, totalXP: newXP, overallLevel: newLevel, nextLevelXP: newNextLevelXP };
        });
        break;
    }
  };

  const value = {
    user,
    authLoading,
    signup,
    login,
    logout,
    updateUserProfile,
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
    isLoading,
    error,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

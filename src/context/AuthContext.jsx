import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const logout = () => signOut(auth);

  const completeOnboarding = async (data) => {
    if (!user) return;
    const resRef = doc(db, 'restaurants', user.uid);
    const newRes = {
      ...data,
      ownerUid: user.uid,
      createdAt: new Date().toISOString(),
      plan: 'basic',
      isActive: false, // Inactive by default as requested
      status: 'inactive',
      startDate: null,
      endDate: null,
      onboardingComplete: true
    };
    await setDoc(resRef, newRes);
    setRestaurant({ id: user.uid, ...newRes });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const resRef = doc(db, 'restaurants', user.uid);
        const resSnap = await getDoc(resRef);
        
        if (resSnap.exists()) {
          setRestaurant({ id: resSnap.id, ...resSnap.data() });
        } else {
          setRestaurant(null); // Triggers onboarding
        }
      } else {
        setRestaurant(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isSubscriptionActive = () => {
    if (!restaurant) return false;
    if (!restaurant.isActive) return false;
    if (!restaurant.endDate) return false;
    
    const now = new Date();
    const expiry = new Date(restaurant.endDate);
    return now <= expiry;
  };

  const value = {
    user,
    restaurant,
    loginWithGoogle,
    logout,
    loading,
    completeOnboarding,
    isSubscriptionActive
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

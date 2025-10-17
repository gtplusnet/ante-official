import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyA4qfOG64hrEeNdM0L1zOceGEl0HX2v27M",
  authDomain: "materdei-353de.firebaseapp.com",
  projectId: "materdei-353de",
  storageBucket: "materdei-353de.firebasestorage.app",
  messagingSenderId: "92758462794",
  appId: "1:92758462794:web:d75462c245232e44cfb1b3",
  measurementId: "G-RC8GC9NSME"
};

// VAPID key for web push notifications
// Using hardcoded value as fallback since PM2 doesn't load .env.local
// Updated from Firebase Console: October 17, 2025
export const FIREBASE_VAPID_KEY = "BHEvUgy6Ir44xBkut77qq_cGgVQSoaTCPE0nbcKIYnOAu0D8uB7C-vgW4QFVgoN7IFrMUTLf9CarhPYvHzVUPXc";

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Messaging (only in browser)
export const getFirebaseMessaging = async () => {
  try {
    const isSupportedBrowser = await isSupported();
    if (isSupportedBrowser && typeof window !== 'undefined') {
      return getMessaging(firebaseApp);
    }
    return null;
  } catch (error) {
    console.error('Firebase messaging not supported:', error);
    return null;
  }
};
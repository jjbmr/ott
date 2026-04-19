import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCbalOrY5HoF-Ekq0gNRGnG3XMrWgi0DgE",
  authDomain: "jbmrsportslive.firebaseapp.com",
  databaseURL: "https://jbmrsportslive-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jbmrsportslive",
  storageBucket: "jbmrsportslive.firebasestorage.app",
  messagingSenderId: "248496385806",
  appId: "1:248496385806:web:366015b3e8a24159a9b15f",
  measurementId: "G-4LL65PBV6V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
export const googleProvider = new GoogleAuthProvider();

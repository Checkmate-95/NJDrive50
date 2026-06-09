import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "njdrive50-app.firebaseapp.com",
  projectId: "njdrive50-app",
  storageBucket: "njdrive50-app.appspot.com",
  messagingSenderId: "378235645280",
  appId: "1:378235645280:web:044f1f4ffe05820ab90205"
};

// ✅ Add these two lines right here
console.log("🔥 firebase.ts LOADED");
console.log("🔥 API KEY:", import.meta.env.VITE_FIREBASE_API_KEY);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

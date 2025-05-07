// Import Firebase modules (CDN style)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCyRm6dWH-fAmfWy83zLTrPFVi9Ny8gyxE",
  authDomain: "cases-e5b4e.firebaseapp.com",
  databaseURL: "https://cases-e5b4e-default-rtdb.firebaseio.com",
  projectId: "cases-e5b4e",
  storageBucket: "cases-e5b4e.appspot.com",
  messagingSenderId: "22502548396",
  appId: "1:22502548396:web:aac335672c21f07524d009"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get database and auth instances
const db = getDatabase(app);
const auth = getAuth(app);

// Export them to use elsewhere
export { db, auth };

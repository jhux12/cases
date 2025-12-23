// @ts-nocheck
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, child, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCyRm6dWH8b_BZ0oImEBPW_T3sF14Tz8dE",
  authDomain: "cases-e5b4e.firebaseapp.com",
  databaseURL: "https://cases-e5b4e-default-rtdb.firebaseio.com",
  projectId: "cases-e5b4e",
  storageBucket: "cases-e5b4e.appspot.com",
  messagingSenderId: "1094023497986",
  appId: "1:1094023497986:web:59e018f1aa5e8c4093d7a5"
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, set, child, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const firebaseConfig = window.APP_CONFIG?.firebase;

if (!firebaseConfig) {
  throw new Error('Missing Firebase configuration. Provide config/app-config.js before loading scripts/main.js.');
}

// Initialize
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

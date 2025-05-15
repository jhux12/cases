import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

// ✅ Firebase Config (use your actual config here)
const firebaseConfig = {
  apiKey: "AIzaSyCyRm6dWH8b_BZ0oImEBPW_T3sF14Tz8dE",
  authDomain: "cases-e5b4e.firebaseapp.com",
  databaseURL: "https://cases-e5b4e-default-rtdb.firebaseio.com",
  projectId: "cases-e5b4e",
  storageBucket: "cases-e5b4e.appspot.com",
  messagingSenderId: "1094023497986",
  appId: "1:1094023497986:web:59e018f1aa5e8c4093d7a5"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
  const el = document.getElementById("user-balance");
  if (!el) return;

  if (user) {
    try {
      const userRef = ref(db, 'users/' + user.uid);
      const userSnap = await get(userRef);
      const balance = parseFloat(userSnap.val()?.balance || 0);
      el.innerText = `Balance: ${balance.toLocaleString()} coins`;
    } catch (e) {
      el.innerText = "Balance: Error";
    }
  } else {
    el.innerText = "Balance: Sign in required";
  }
});

<script>
  // Initialize Firebase (compat)
  const firebaseConfig = {
    apiKey: "AIzaSyCyRm6dWH-fAmfWy83zLTrPFVi9Ny8gyxE",
    authDomain: "cases-e5b4e.firebaseapp.com",
    databaseURL: "https://cases-e5b4e-default-rtdb.firebaseio.com",
    projectId: "cases-e5b4e",
    storageBucket: "cases-e5b4e.appspot.com",
    messagingSenderId: "22502548396",
    appId: "1:22502548396:web:aac335672c21f07524d009"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  const auth = firebase.auth();

  // ✅ Global balance updater function
  window.updateUserBalance = function () {
    const el = document.getElementById("user-balance");
    if (!el) {
      console.warn("⚠️ #user-balance element not found in DOM.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      el.textContent = "Balance: Sign in required";
      return;
    }

    db.ref("users/" + user.uid).once("value").then((snap) => {
      const balance = snap.val()?.balance || 0;
      el.textContent = `Balance: ${parseFloat(balance).toLocaleString()} coins`;
      console.log("✅ Balance updated to:", balance);
    }).catch((error) => {
      console.error("❌ Failed to fetch balance:", error);
      el.textContent = "Balance: error";
    });
  };

  // ✅ Call on login
  auth.onAuthStateChanged((user) => {
    if (user) {
      window.updateUserBalance();
    } else {
      const el = document.getElementById("user-balance");
      if (el) el.textContent = "Balance: Sign in required";
    }
  });

  // ✅ OPTIONAL: Wait for DOM and update just in case
  document.addEventListener("DOMContentLoaded", () => {
    window.updateUserBalance();
  });
</script>

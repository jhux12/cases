<!-- Load Firebase SDKs via CDN -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>

<script>
  // Firebase config
  const firebaseConfig = {
    apiKey: "AIzaSyCyRm6dWH-fAmfWy83zLTrPFVi9Ny8gyxE",
    authDomain: "cases-e5b4e.firebaseapp.com",
    databaseURL: "https://cases-e5b4e-default-rtdb.firebaseio.com",
    projectId: "cases-e5b4e",
    storageBucket: "cases-e5b4e.appspot.com",
    messagingSenderId: "22502548396",
    appId: "1:22502548396:web:aac335672c21f07524d009"
  };

  // Initialize Firebase and expose globally
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database(); // ⬅️ THIS makes db available to all your non-module scripts
  const auth = firebase.auth();
</script>

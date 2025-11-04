// Initialize Firebase globally using the compat SDK and runtime config
(function initFirebase(global) {
  if (!global.firebase) {
    console.error('[firebase-config] Firebase SDK not loaded.');
    return;
  }

  const firebaseConfig = global.APP_CONFIG?.firebase;
  if (!firebaseConfig) {
    console.error('[firebase-config] Missing Firebase configuration.');
    return;
  }

  if (!global.firebase.apps || !global.firebase.apps.length) {
    global.firebase.initializeApp(firebaseConfig);
  }

  global.db = global.firebase.database();
  global.auth = global.firebase.auth();
})(window);

function updateUserBalanceCompat() {
  const user = firebase.auth().currentUser;
  const balanceEl = document.getElementById("user-balance");
  if (!user || !balanceEl) return;

  firebase.database().ref("users/" + user.uid).once("value").then((snap) => {
    const balance = snap.val()?.balance || 0;
    balanceEl.textContent = `Balance: ${parseFloat(balance).toLocaleString()} gems`;
  }).catch(() => {
    balanceEl.textContent = "Balance: error";
  });
}

window.updateUserBalance = function () {
  const user = firebase.auth().currentUser;
  const el = document.getElementById("user-balance");
  if (!user || !el) return;

  firebase.database().ref("users/" + user.uid).once("value").then(snap => {
    const balance = snap.val()?.balance || 0;
    el.textContent = `Balance: ${parseFloat(balance).toLocaleString()} gems`;
  }).catch(() => {
    el.textContent = "Balance: error";
  });
};
window.updateUserBalance = function () {
  const user = firebase.auth().currentUser;
  const el = document.getElementById("user-balance");
  if (!user || !el) return;

  firebase.database().ref("users/" + user.uid).once("value").then((snap) => {
    const balance = snap.val()?.balance || 0;
    el.textContent = `Balance: ${parseFloat(balance).toLocaleString()} gems`;
    console.log("✅ Balance updated to:", balance);
  }).catch((error) => {
    console.error("❌ Failed to fetch balance:", error);
    el.textContent = "Balance: error";
  });
};

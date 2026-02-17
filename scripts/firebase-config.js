// @ts-nocheck
// Initialize Firebase globally using the compat SDK
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
function updateUserBalanceCompat() {
    const user = firebase.auth().currentUser;
    const balanceEl = document.getElementById("user-balance");
    if (!user || !balanceEl)
        return;
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
    if (!user || !el)
        return;
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
    if (!user || !el)
        return;
    firebase.database().ref("users/" + user.uid).once("value").then((snap) => {
        const balance = snap.val()?.balance || 0;
        el.textContent = `Balance: ${parseFloat(balance).toLocaleString()} gems`;
        console.log("✅ Balance updated to:", balance);
    }).catch((error) => {
        console.error("❌ Failed to fetch balance:", error);
        el.textContent = "Balance: error";
    });
};

// @ts-nocheck
// scripts/balance.js
document.addEventListener('DOMContentLoaded', () => {
    const balanceElement = document.getElementById("user-balance");
    if (!balanceElement || typeof firebase === 'undefined')
        return;
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const snapshot = await firebase.database().ref("users/" + user.uid).get();
                const balance = snapshot.val()?.balance || 0;
                balanceElement.innerText = `Balance: ${Number(balance).toLocaleString()} gems`;
            }
            catch (error) {
                console.error("Error loading balance:", error);
                balanceElement.innerText = `Balance: Error`;
            }
        }
        else {
            balanceElement.innerText = `Balance: Sign in required`;
        }
    });
});

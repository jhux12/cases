window.addEventListener('DOMContentLoaded', () => {
  const mobileAuthButton = document.getElementById('mobile-auth-button');
  const logoutDesktop = document.getElementById('logout-desktop');
  const signinDesktop = document.getElementById('signin-desktop');
  const inventoryLink = document.getElementById('inventory-link');

  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      const userRef = firebase.database().ref('users/' + user.uid);
      const snapshot = await userRef.once('value');

      console.log("Auth user:", user.uid);
      console.log("User data from Firebase:", snapshot.val());

      const userData = snapshot.val() || {};

      // Show balances
      document.getElementById('balance-amount').innerText = userData.balance || 0;
      document.getElementById('balance-amount-mobile').innerText = userData.balance || 0;
      document.getElementById('popup-balance').innerText = `${userData.balance || 0} coins`;
      document.getElementById('user-balance').classList.remove('hidden');

      // Set username if it exists
      if (userData.username) {
        document.getElementById('username-display').innerText = userData.username;
      }

      // Show inventory link in mobile menu
      if (inventoryLink) inventoryLink.classList.remove('hidden');

      // Show desktop logout, hide sign in
      if (logoutDesktop) {
        logoutDesktop.style.display = "block";
        logoutDesktop.onclick = (e) => {
          e.preventDefault();
          firebase.auth().signOut().then(() => location.reload());
        };
      }
      if (signinDesktop) signinDesktop.style.display = "none";

      // Setup mobile auth button to logout
      if (mobileAuthButton) {
        mobileAuthButton.innerText = "Logout";
        mobileAuthButton.href = "#";
        mobileAuthButton.onclick = (e) => {
          e.preventDefault();
          firebase.auth().signOut().then(() => location.reload());
        };
      }

    } else {
      // User signed out
      document.getElementById('user-balance').classList.add('hidden');
      document.getElementById('balance-amount').innerText = '0';
      document.getElementById('username-display').innerText = "User";

      if (inventoryLink) inventoryLink.classList.add('hidden');

      if (logoutDesktop) logoutDesktop.style.display = "none";
      if (signinDesktop) signinDesktop.style.display = "block";

      if (mobileAuthButton) {
        mobileAuthButton.innerText = "Sign In";
        mobileAuthButton.href = "auth.html";
        mobileAuthButton.onclick = null;
      }
    }
  });
});

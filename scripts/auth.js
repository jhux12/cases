window.addEventListener('DOMContentLoaded', () => {
  const mobileAuthButton = document.getElementById('mobile-auth-button');
  const logoutDesktop = document.getElementById('logout-desktop');
  const signinDesktop = document.getElementById('signin-desktop');

  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      const userRef = firebase.database().ref('users/' + user.uid);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val() || {};
      

      document.getElementById('balance-amount').innerText = userData.balance || 0;
      document.getElementById('balance-amount-mobile').innerText = userData.balance || 0;
      document.getElementById('popup-balance').innerText = `${userData.balance || 0} coins`;
      document.getElementById('user-balance').classList.remove('hidden');
      if (userData.username) {
  document.getElementById('username-display').innerText = userData.username;
}


      if (logoutDesktop) {
        logoutDesktop.style.display = "block";
        logoutDesktop.onclick = (e) => {
          e.preventDefault();
          firebase.auth().signOut().then(() => location.reload());
        };
      }

      if (signinDesktop) signinDesktop.style.display = "none";

      if (mobileAuthButton) {
        mobileAuthButton.innerText = "Logout";
        mobileAuthButton.href = "#";
        mobileAuthButton.onclick = (e) => {
          e.preventDefault();
          firebase.auth().signOut().then(() => location.reload());
        };
      }

    } else {
      document.getElementById('user-balance').classList.add('hidden');
      document.getElementById('balance-amount').innerText = '0';
      document.getElementById('username-display').innerText = "User";

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

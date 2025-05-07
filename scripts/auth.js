import { db, auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, get, set, child, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

window.addEventListener('DOMContentLoaded', () => {
  const mobileAuthButton = document.getElementById('mobile-auth-button');
  const logoutDesktop = document.getElementById('logout-desktop');
  const signinDesktop = document.getElementById('signin-desktop');

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userRef = ref(db, 'users/' + user.uid);
      const snapshot = await get(userRef);
      const userData = snapshot.val() || {};

      // Update UI with user data
      document.getElementById('balance-amount').innerText = userData.balance || 0;
      document.getElementById('balance-amount-mobile').innerText = userData.balance || 0;
      document.getElementById('popup-balance').innerText = `${userData.balance || 0} coins`;
      document.getElementById('user-balance').classList.remove('hidden');

      // Show logout, hide signin
      if (logoutDesktop) {
        logoutDesktop.style.display = "block";
        logoutDesktop.onclick = (e) => {
          e.preventDefault();
          signOut(auth).then(() => location.reload());
        };
      }

      if (signinDesktop) signinDesktop.style.display = "none";

      if (mobileAuthButton) {
        mobileAuthButton.innerText = "Logout";
        mobileAuthButton.href = "#";
        mobileAuthButton.onclick = (e) => {
          e.preventDefault();
          signOut(auth).then(() => location.reload());
        };
      }

    } else {
      // User signed out
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

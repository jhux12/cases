window.addEventListener('DOMContentLoaded', () => {
  const mobileAuthButton = document.getElementById('mobile-auth-button');
  const logoutDesktop = document.getElementById('logout-desktop');
  const signinDesktop = document.getElementById('signin-desktop');
  const inventoryLink = document.getElementById('inventory-link');

  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      const userRef = firebase.database().ref('users/' + user.uid);
      const snapshot = await userRef.once('value');
      const userData = snapshot.val() || {};

      // ✅ Setup Provably Fair if missing
      if (!userData.provablyFair) {
        const serverSeed = generateRandomString(64);
        const serverSeedHash = await sha256(serverSeed);
        await userRef.child('provablyFair').set({
          serverSeed,
          serverSeedHash,
          clientSeed: 'default',
          nonce: 0
        });
      }

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

      // Desktop logout
      if (logoutDesktop) {
        logoutDesktop.style.display = "block";
        logoutDesktop.onclick = (e) => {
          e.preventDefault();
          firebase.auth().signOut().then(() => location.reload());
        };
      }

      if (signinDesktop) signinDesktop.style.display = "none";

      // Mobile auth button → logout
      if (mobileAuthButton) {
        mobileAuthButton.innerText = "Logout";
        mobileAuthButton.href = "#";
        mobileAuthButton.onclick = (e) => {
          e.preventDefault();
          firebase.auth().signOut().then(() => location.reload());
        };
      }

    } else {
      // Signed out state
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

// 🔐 Utility: generate server seed
function generateRandomString(length) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

// 🔐 Utility: sha256 hash
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

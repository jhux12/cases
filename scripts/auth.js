import { db } from './firebase-config.js';

function generateRandomString(length) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hashBuffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

firebase.auth().onAuthStateChanged(async user => {
  const logoutDesktop = document.getElementById('logout-desktop');
  const signinDesktop = document.getElementById('signin-desktop');
  const usernameEl = document.getElementById('username-display');
  const mobileAuthButton = document.getElementById('mobile-auth-button');

  if (user) {
    if (signinDesktop) signinDesktop.style.display = "none";
    if (usernameEl) usernameEl.innerText = user.displayName || user.email || "User";

    const invLink = document.getElementById('inventory-link');
    if (invLink) invLink.classList.remove('hidden');

    const userRef = db.ref('users/' + user.uid);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) await userRef.set({ balance: 0 });

    const userData = snapshot.val() || { balance: 0 };
    const fairRef = userRef.child('provablyFair');
    const fairSnap = await fairRef.once('value');
    const fairData = fairSnap.val();

    const input = document.getElementById('client-seed-input');
    if (input && fairData?.clientSeed) input.value = fairData.clientSeed;

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!fairData || !fairData.lastRotation || now - fairData.lastRotation > oneDay) {
      const newServerSeed = generateRandomString(64);
      const newServerSeedHash = await sha256(newServerSeed);
      await fairRef.set({
        serverSeed: newServerSeed,
        serverSeedHash: newServerSeedHash,
        clientSeed: 'default',
        nonce: 0,
        lastRotation: now
      });
    }

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

    document.getElementById('balance-amount').innerText = userData.balance;
    document.getElementById('balance-amount-mobile').innerText = userData.balance;
    document.getElementById('popup-balance').innerText = `${userData.balance} coins`;
    document.getElementById('user-balance').classList.remove('hidden');

    if (logoutDesktop) logoutDesktop.onclick = e => {
      e.preventDefault();
      firebase.auth().signOut().then(() => location.reload());
    };

    if (mobileAuthButton) {
      mobileAuthButton.innerText = "Logout";
      mobileAuthButton.href = "#";
      mobileAuthButton.onclick = e => {
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


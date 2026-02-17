// @ts-nocheck
// scripts/profile.js

let twoFactorRecaptchaVerifier = null;
let twoFactorVerificationId = null;

document.addEventListener('DOMContentLoaded', () => {
  firebase.auth().onAuthStateChanged(user => {
    if (!user) return (window.location.href = 'auth.html');
    const currentUid = user.uid;
    const params = new URLSearchParams(window.location.search);
    const targetUid = params.get('uid') || currentUid;
    loadProfile(targetUid, currentUid);
    setupSearch();
    loadTopUsers();
  });
});

async function loadProfile(uid, currentUid) {
  const isOwn = uid === currentUid;
  const userRef = firebase.database().ref('users/' + uid);
  const userSnap = await userRef.once('value');
  const userData = userSnap.val() || {};
  const username = userData.username || 'Anonymous';
  const usernameInput = document.getElementById('username-input');
  if (usernameInput) {
    usernameInput.value = username;
    if (!isOwn) usernameInput.disabled = true;
  }
  const titleEl = document.getElementById('profile-title');
  if (titleEl) titleEl.innerText = isOwn ? 'Your Profile' : `${username}'s Profile`;

  if (isOwn) {
    document.getElementById('email').value = firebase.auth().currentUser.email;
  } else {
    document.getElementById('email').parentElement.classList.add('hidden');
  }

  const initialsSource = isOwn ? firebase.auth().currentUser.email : username;
  const initials = initialsSource ? initialsSource.substring(0, 2).toUpperCase() : '??';
  document.getElementById('profile-pic').textContent = initials;

  const doc = await firebase.firestore().collection('leaderboard').doc(uid).get();
  const data = doc.data() || {};
  const packsOpened = data.packsOpened || 0;
  const cardValue = data.cardValue || 0;

  document.getElementById('packs-opened').innerText = packsOpened.toLocaleString();
  document.getElementById('total-won').innerText = cardValue.toLocaleString();

  const historySnap = await firebase.database().ref('users/' + uid + '/unboxHistory').once('value');
  let totalSpent = 0;
  let rarest = null;
  const pulls = [];
  historySnap.forEach(child => {
    const d = child.val();
    totalSpent += Math.max(0, (d.balanceBefore || 0) - (d.balanceAfter || 0));
    if (!rarest || (d.value || 0) > (rarest.value || 0)) {
      rarest = d;
    }
    d._time = d.time || d.timestamp || child.key;
    pulls.push(d);
  });
  document.getElementById('total-spent').innerText = totalSpent.toLocaleString();
  const rareEl = document.getElementById('rarest-pull');
  if (rarest) {
    rareEl.innerHTML = `<img src="${rarest.image}" class="h-16 mx-auto mb-2"><p>${rarest.name} (${rarest.rarity})</p>`;
  } else {
    rareEl.textContent = 'No pulls yet.';
  }
  const recentList = document.getElementById('recent-pulls');
  if (recentList) {
    pulls.sort((a, b) => (b._time || 0) - (a._time || 0));
    recentList.innerHTML = '';
    pulls.slice(0, 5).forEach(p => {
      const li = document.createElement('li');
      li.className = 'p-2 flex items-center gap-2 hover:bg-gray-700';
      li.innerHTML = `<img src="${p.image}" class="h-10 w-10 object-cover rounded"><div><p class="text-sm">${p.name || 'Unknown'}</p><p class="text-xs text-gray-400">${(p.value || 0).toLocaleString()}</p></div>`;
      recentList.appendChild(li);
    });
  }

  if (!isOwn) {
    document.querySelector('button[onclick="updateProfile()"]').classList.add('hidden');
    document.getElementById('current-password').parentElement.classList.add('hidden');
    document.getElementById('new-password').parentElement.classList.add('hidden');
    document.querySelector('button[onclick="changePassword()"]').classList.add('hidden');
    const twoFactorSection = document.getElementById('two-factor-section');
    if (twoFactorSection) twoFactorSection.classList.add('hidden');
  } else {
    initializeTwoFactorSection(userData);
  }
}

function setupSearch() {
  const searchInput = document.getElementById('user-search');
  if (!searchInput) return;
  searchInput.addEventListener('input', async e => {
    const q = e.target.value.trim();
    const list = document.getElementById('user-list');
    const topTitle = document.getElementById('top-users-title');
    const topList = document.getElementById('top-users');
    if (!list) return;
    if (!q) {
      list.innerHTML = '';
      if (topTitle) topTitle.classList.remove('hidden');
      if (topList) topList.classList.remove('hidden');
      return;
    }
    if (topTitle) topTitle.classList.add('hidden');
    if (topList) topList.classList.add('hidden');
    const snap = await firebase.firestore().collection('leaderboard')
      .orderBy('username')
      .startAt(q)
      .endAt(q + '\uf8ff')
      .limit(5)
      .get();
    list.innerHTML = '';
    snap.forEach(doc => {
      const li = document.createElement('li');
      li.className = 'p-2 hover:bg-gray-700 cursor-pointer';
      li.textContent = doc.data().username || 'Anonymous';
      li.onclick = () => { window.location.href = `profile.html?uid=${doc.id}`; };
      list.appendChild(li);
    });
  });
}

async function loadTopUsers() {
  const list = document.getElementById('top-users');
  if (!list) return;
  const snap = await firebase.firestore().collection('leaderboard')
    .orderBy('cardValue', 'desc')
    .limit(5)
    .get();
  list.innerHTML = '';
  snap.forEach(doc => {
    const li = document.createElement('li');
    li.className = 'p-2 hover:bg-gray-700 cursor-pointer flex justify-between';
    const data = doc.data();
    li.innerHTML = `<span>${data.username || 'Anonymous'}</span><span>${(data.cardValue || 0).toLocaleString()}</span>`;
    li.onclick = () => { window.location.href = `profile.html?uid=${doc.id}`; };
    list.appendChild(li);
  });
}

function updateProfile() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  const newUsername = document.getElementById('username-input').value;
  user.updateProfile({ displayName: newUsername })
    .then(() => firebase.database().ref('users/' + user.uid).update({ username: newUsername }))
    .then(() => {
      alert('✅ Username updated!');
      location.reload();
    })
    .catch(err => alert('❌ Error: ' + err.message));
}

function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const user = firebase.auth().currentUser;
  if (!currentPassword || !newPassword) {
    alert('Please fill out both password fields.');
    return;
  }
  const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
  user.reauthenticateWithCredential(credential)
    .then(() => user.updatePassword(newPassword))
    .then(() => {
      alert('✅ Password updated successfully.');
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
    })
    .catch(error => alert('❌ ' + error.message));
}

function initializeTwoFactorSection(userData) {
  const section = document.getElementById('two-factor-section');
  if (!section) return;
  const statusEl = document.getElementById('two-factor-status');
  const setupWrapper = document.getElementById('two-factor-setup');
  const verifyWrapper = document.getElementById('two-factor-verify-wrapper');
  const sendBtn = document.getElementById('two-factor-send');
  const verifyBtn = document.getElementById('two-factor-verify');
  const disableBtn = document.getElementById('two-factor-disable');
  const phoneInput = document.getElementById('two-factor-phone');
  const codeInput = document.getElementById('two-factor-code');

  const currentUser = firebase.auth().currentUser;
  if (currentUser && currentUser.phoneNumber) {
    phoneInput.value = currentUser.phoneNumber;
  }

  const isEnabled = !!(userData.twoFactorEnabled && currentUser && currentUser.phoneNumber);

  function updateStatus(enabled, phone) {
    if (enabled) {
      const activePhone = phone || (currentUser && currentUser.phoneNumber) || '';
      statusEl.textContent = activePhone ? `Enabled (${activePhone})` : 'Enabled';
      setupWrapper.classList.add('hidden');
      verifyWrapper.classList.add('hidden');
      disableBtn.classList.remove('hidden');
    } else {
      statusEl.textContent = 'Disabled';
      setupWrapper.classList.remove('hidden');
      verifyWrapper.classList.add('hidden');
      disableBtn.classList.add('hidden');
    }
  }

  updateStatus(isEnabled, (currentUser && currentUser.phoneNumber) || userData.phoneNumber);

  if (!twoFactorRecaptchaVerifier) {
    twoFactorRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('twofactor-recaptcha', {
      size: 'invisible'
    });
    twoFactorRecaptchaVerifier.render();
  }

  sendBtn.onclick = async () => {
    const rawPhone = phoneInput.value.trim();
    const formatted = formatPhoneNumberE164(rawPhone);
    if (!formatted) {
      alert('Please enter a valid phone number with country code.');
      return;
    }
    twoFactorVerificationId = null;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    try {
      const provider = new firebase.auth.PhoneAuthProvider();
      twoFactorVerificationId = await provider.verifyPhoneNumber(formatted, twoFactorRecaptchaVerifier);
      verifyWrapper.classList.remove('hidden');
      codeInput.value = '';
      alert('Verification code sent!');
    } catch (error) {
      alert('❌ ' + error.message);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Verification Code';
    }
  };

  verifyBtn.onclick = async () => {
    const code = codeInput.value.trim();
    const rawPhone = phoneInput.value.trim();
    const formatted = formatPhoneNumberE164(rawPhone);
    if (!twoFactorVerificationId || !code) {
      alert('Please request and enter the verification code.');
      return;
    }
    if (!formatted) {
      alert('Please enter a valid phone number with country code.');
      return;
    }
    try {
      const credential = firebase.auth.PhoneAuthProvider.credential(twoFactorVerificationId, code);
      const linkedUser = firebase.auth().currentUser;
      await linkedUser.linkWithCredential(credential);
      await linkedUser.reload();
      await firebase.database().ref('users/' + linkedUser.uid).update({
        phoneNumber: formatted,
        phoneVerified: true,
        twoFactorEnabled: true
      });
      updateStatus(true, formatted);
      twoFactorVerificationId = null;
      alert('✅ Two-factor authentication enabled!');
    } catch (error) {
      alert('❌ ' + error.message);
    }
  };

  disableBtn.onclick = async () => {
    if (!confirm('Disable two-factor authentication?')) return;
    try {
      const activeUser = firebase.auth().currentUser;
      await activeUser.unlink(firebase.auth.PhoneAuthProvider.PROVIDER_ID);
      await activeUser.reload();
    } catch (error) {
      if (error.code !== 'auth.no-such-provider') {
        alert('❌ ' + error.message);
        return;
      }
    }
    const refreshedUser = firebase.auth().currentUser;
    await firebase.database().ref('users/' + refreshedUser.uid).update({
      phoneNumber: null,
      phoneVerified: false,
      twoFactorEnabled: false
    });
    phoneInput.value = '';
    updateStatus(false);
    twoFactorVerificationId = null;
    alert('Two-factor authentication disabled.');
  };
}

function formatPhoneNumberE164(input) {
  if (!input) return null;
  const trimmed = input.trim();
  let digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) {
    digits = '+' + digits;
  } else {
    digits = '+1' + digits;
  }
  const e164Regex = /^\+[1-9]\d{9,14}$/;
  return e164Regex.test(digits) ? digits : null;
}


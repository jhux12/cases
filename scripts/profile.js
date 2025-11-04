// scripts/profile.js

let profileRecaptchaVerifier = null;
let phoneVerificationId = null;
let phoneCountdownTimer = null;

const profileSecurityState = {
  isOwnProfile: false,
  phoneVerified: false,
  hasPhone: false,
  twoFactorEnabled: false,
  phoneNumber: ''
};

document.addEventListener('DOMContentLoaded', () => {
  const sendPhoneBtn = document.getElementById('send-phone-code');
  if (sendPhoneBtn) sendPhoneBtn.addEventListener('click', handleSendPhoneCode);
  const verifyPhoneBtn = document.getElementById('verify-phone-code');
  if (verifyPhoneBtn) verifyPhoneBtn.addEventListener('click', handleVerifyPhoneCode);
  const twoFactorToggle = document.getElementById('two-factor-toggle');
  if (twoFactorToggle) twoFactorToggle.addEventListener('change', handleTwoFactorToggle);

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

function ensureProfileRecaptcha() {
  if (!profileRecaptchaVerifier) {
    profileRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('profile-recaptcha-container', {
      size: 'invisible'
    });
  }
  return profileRecaptchaVerifier;
}

function formatPhoneNumberForAuth(value) {
  if (!value) return '';
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }
  return `+1${digits}`;
}

function setPhoneStatus(message, type = 'muted') {
  const statusEl = document.getElementById('phone-status');
  if (!statusEl) return;
  statusEl.textContent = message || '';
  statusEl.classList.remove('text-gray-600', 'text-green-600', 'text-red-500');
  const map = {
    muted: 'text-gray-600',
    success: 'text-green-600',
    error: 'text-red-500'
  };
  statusEl.classList.add(map[type] || 'text-gray-600');
}

function setTwoFactorStatus(message, type = 'muted') {
  const statusEl = document.getElementById('two-factor-status');
  if (!statusEl) return;
  statusEl.textContent = message || '';
  statusEl.classList.remove('text-gray-600', 'text-green-600', 'text-red-500');
  const map = {
    muted: 'text-gray-600',
    success: 'text-green-600',
    error: 'text-red-500'
  };
  statusEl.classList.add(map[type] || 'text-gray-600');
}

function updateTwoFactorUI() {
  const section = document.getElementById('two-factor-section');
  const toggle = document.getElementById('two-factor-toggle');
  if (!section || !toggle) return;

  if (!profileSecurityState.isOwnProfile) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  const canEnable = profileSecurityState.phoneVerified && profileSecurityState.hasPhone;
  toggle.checked = !!profileSecurityState.twoFactorEnabled;
  toggle.disabled = !canEnable;

  if (!canEnable) {
    setTwoFactorStatus('Verify your phone number above to enable two-factor authentication.', 'muted');
  } else if (profileSecurityState.twoFactorEnabled) {
    setTwoFactorStatus('Two-factor authentication is enabled. Phone sign-in will be required.', 'success');
  } else {
    setTwoFactorStatus('Two-factor authentication is disabled. You can enable it once you are ready.', 'muted');
  }
}

function clearPhoneCountdown(button) {
  if (phoneCountdownTimer) {
    clearInterval(phoneCountdownTimer);
    phoneCountdownTimer = null;
  }
  if (button) {
    button.disabled = false;
    button.textContent = 'Send Code';
  }
}

function startPhoneCountdown(button) {
  clearPhoneCountdown();
  let remaining = 60;
  button.disabled = true;
  button.textContent = `Resend (${remaining})`;
  phoneCountdownTimer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearPhoneCountdown(button);
      return;
    }
    button.textContent = `Resend (${remaining})`;
  }, 1000);
}

async function loadProfile(uid, currentUid) {
  const isOwn = uid === currentUid;
  const userRef = firebase.database().ref('users/' + uid);
  const userSnap = await userRef.once('value');
  const userData = userSnap.val() || {};
  profileSecurityState.isOwnProfile = isOwn;
  profileSecurityState.phoneVerified = !!userData.phoneVerified;
  profileSecurityState.hasPhone = !!userData.phoneNumber;
  profileSecurityState.twoFactorEnabled = !!userData.twoFactorEnabled;
  profileSecurityState.phoneNumber = userData.phoneNumber || '';
  updateTwoFactorUI();
  const username = userData.username || 'Anonymous';
  const usernameInput = document.getElementById('username-input');
  if (usernameInput) {
    usernameInput.value = username;
    if (!isOwn) usernameInput.disabled = true;
  }
  const titleEl = document.getElementById('profile-title');
  if (titleEl) titleEl.innerText = isOwn ? 'Your Profile' : `${username}'s Profile`;

  const emailInput = document.getElementById('email');
  if (emailInput) {
    if (isOwn) {
      const currentEmail = (firebase.auth().currentUser && firebase.auth().currentUser.email) || '';
      emailInput.value = currentEmail;
    } else {
      emailInput.parentElement.classList.add('hidden');
    }
  }

  const phoneSection = document.getElementById('phone-section');
  const phoneCodeSection = document.getElementById('phone-code-section');
  const phoneInput = document.getElementById('phone-number-input');
  const sendPhoneBtn = document.getElementById('send-phone-code');
  if (phoneSection && phoneCodeSection && phoneInput && sendPhoneBtn) {
    if (!isOwn) {
      phoneSection.classList.add('hidden');
      phoneCodeSection.classList.add('hidden');
    } else {
      phoneSection.classList.remove('hidden');
      phoneInput.disabled = false;
      phoneInput.value = userData.phoneNumber || '';
      phoneCodeSection.classList.add('hidden');
      const codeInput = document.getElementById('phone-code-input');
      if (codeInput) codeInput.value = '';
      phoneVerificationId = null;
      if (userData.phoneVerified && userData.phoneNumber) {
        setPhoneStatus(`Verified on ${userData.phoneNumber}`, 'success');
      } else if (userData.phoneNumber) {
        setPhoneStatus('Phone number saved but not verified. Send a code to verify.', 'muted');
      } else {
        setPhoneStatus('Add and verify a phone number to enable SMS login.', 'muted');
      }
      clearPhoneCountdown(sendPhoneBtn);
      sendPhoneBtn.textContent = userData.phoneVerified ? 'Change Number' : 'Send Code';
    }
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
    const statusEl = document.getElementById('phone-status');
    if (statusEl) statusEl.parentElement.classList.add('hidden');
  }
}

async function handleSendPhoneCode() {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert('Please sign in again to update your phone number.');
    return;
  }

  const phoneInput = document.getElementById('phone-number-input');
  const sendPhoneBtn = document.getElementById('send-phone-code');
  const phoneCodeSection = document.getElementById('phone-code-section');
  if (!phoneInput || !sendPhoneBtn || !phoneCodeSection) return;

  const formatted = formatPhoneNumberForAuth(phoneInput.value);
  const e164Regex = /^\+[1-9]\d{9,14}$/;
  if (!e164Regex.test(formatted)) {
    setPhoneStatus('Enter a valid phone number with country code (e.g. +15551234567).', 'error');
    return;
  }

  try {
    sendPhoneBtn.disabled = true;
    sendPhoneBtn.textContent = 'Sending...';
    setPhoneStatus('Sending verification code...', 'muted');
    const verifier = ensureProfileRecaptcha();
    const provider = new firebase.auth.PhoneAuthProvider();
    phoneVerificationId = await provider.verifyPhoneNumber(formatted, verifier);
    phoneCodeSection.classList.remove('hidden');
    const codeInput = document.getElementById('phone-code-input');
    if (codeInput) codeInput.value = '';
    setPhoneStatus(`Code sent to ${formatted}. Enter it below to verify.`, 'muted');
    startPhoneCountdown(sendPhoneBtn);
  } catch (error) {
    clearPhoneCountdown(sendPhoneBtn);
    setPhoneStatus(error.message || 'Failed to send verification code.', 'error');
    if (typeof grecaptcha !== 'undefined' && profileRecaptchaVerifier) {
      profileRecaptchaVerifier.render().then(widgetId => grecaptcha.reset(widgetId));
    }
    if (firebase.auth().currentUser && firebase.auth().currentUser.phoneNumber) {
      sendPhoneBtn.textContent = 'Change Number';
    }
  }
}

async function handleVerifyPhoneCode() {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert('Please sign in again to update your phone number.');
    return;
  }

  if (!phoneVerificationId) {
    setPhoneStatus('Please request a verification code first.', 'error');
    return;
  }

  const codeInput = document.getElementById('phone-code-input');
  const sendPhoneBtn = document.getElementById('send-phone-code');
  if (!codeInput || !sendPhoneBtn) return;
  const code = codeInput.value.trim();
  if (!code) {
    setPhoneStatus('Enter the verification code that was sent to your phone.', 'error');
    return;
  }

  try {
    setPhoneStatus('Verifying code...', 'muted');
    const credential = firebase.auth.PhoneAuthProvider.credential(phoneVerificationId, code);
    let linkResult;
    try {
      linkResult = await user.linkWithCredential(credential);
    } catch (err) {
      if (err.code === 'auth/provider-already-linked') {
        await user.updatePhoneNumber(credential);
        linkResult = { user };
      } else {
        throw err;
      }
    }
    const linkedUser = linkResult.user || firebase.auth().currentUser;
    const phoneNumber = linkedUser.phoneNumber;
    if (phoneNumber) {
      await firebase.database().ref('users/' + linkedUser.uid).update({
        phoneNumber,
        phoneVerified: true
      });
      document.getElementById('phone-number-input').value = phoneNumber;
      setPhoneStatus(`Verified on ${phoneNumber}`, 'success');
      profileSecurityState.phoneVerified = true;
      profileSecurityState.hasPhone = true;
      profileSecurityState.phoneNumber = phoneNumber;
      updateTwoFactorUI();
    } else {
      setPhoneStatus('Phone verified.', 'success');
    }
    const codeSection = document.getElementById('phone-code-section');
    if (codeSection) codeSection.classList.add('hidden');
    codeInput.value = '';
    phoneVerificationId = null;
    clearPhoneCountdown(sendPhoneBtn);
    sendPhoneBtn.textContent = 'Change Number';
  } catch (error) {
    if (error.code === 'auth/credential-already-in-use') {
      setPhoneStatus('That phone number is already linked to another account. Try a different number.', 'error');
    } else if (error.code === 'auth/invalid-verification-code' || error.code === 'auth/code-expired') {
      setPhoneStatus('The verification code is invalid or expired. Please request a new code.', 'error');
    } else if (error.code === 'auth/requires-recent-login') {
      setPhoneStatus('Please sign out and sign back in before updating your phone number.', 'error');
    } else {
      setPhoneStatus(error.message || 'Failed to verify code.', 'error');
    }
  }
}

async function handleTwoFactorToggle(event) {
  const toggle = event.target;
  const desiredState = !!toggle.checked;

  if (!profileSecurityState.phoneVerified || !profileSecurityState.hasPhone) {
    toggle.checked = false;
    updateTwoFactorUI();
    alert('Please verify your phone number before enabling two-factor authentication.');
    return;
  }

  const user = firebase.auth().currentUser;
  if (!user) {
    toggle.checked = profileSecurityState.twoFactorEnabled;
    updateTwoFactorUI();
    alert('Please sign in again to change two-factor settings.');
    return;
  }

  toggle.disabled = true;
  setTwoFactorStatus(desiredState ? 'Enabling two-factor authentication...' : 'Disabling two-factor authentication...', 'muted');

  try {
    await firebase.database().ref('users/' + user.uid).update({
      twoFactorEnabled: desiredState
    });
    profileSecurityState.twoFactorEnabled = desiredState;
    updateTwoFactorUI();
    setTwoFactorStatus(desiredState ? 'Two-factor authentication is enabled. Phone sign-in will be required.' : 'Two-factor authentication is disabled. You can enable it once you are ready.', desiredState ? 'success' : 'muted');
  } catch (error) {
    toggle.checked = profileSecurityState.twoFactorEnabled;
    updateTwoFactorUI();
    alert('❌ ' + (error.message || 'Unable to update two-factor settings.'));
  } finally {
    toggle.disabled = false;
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


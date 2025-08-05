// scripts/profile.js

document.addEventListener('DOMContentLoaded', () => {
  firebase.auth().onAuthStateChanged(user => {
    if (!user) return (window.location.href = 'auth.html');
    const currentUid = user.uid;
    const params = new URLSearchParams(window.location.search);
    const targetUid = params.get('uid') || currentUid;
    loadProfile(targetUid, currentUid);
    setupSearch();
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

  const badgeSnap = await firebase.database().ref('milestoneConfig/badges').once('value');
  const badgeCfg = badgeSnap.val() || [];
  let currentBadge = null;
  if (Array.isArray(badgeCfg)) {
    badgeCfg.forEach(b => {
      const threshold = b.threshold || 0;
      const type = b.type || 'packs';
      if ((type === 'packs' && packsOpened >= threshold) || (type === 'value' && cardValue >= threshold)) {
        if (!currentBadge || threshold > (currentBadge.threshold || 0)) currentBadge = b;
      }
    });
  }
  const badgeContainer = document.getElementById('badge-container');
  if (currentBadge) {
    const color = currentBadge.color || '#9333ea';
    badgeContainer.innerHTML = `<span class="text-white text-xs px-2 py-1 rounded-full" style="background-color:${color}">${currentBadge.name}</span>`;
  } else {
    badgeContainer.innerHTML = '<p class="text-sm text-gray-400">No badge yet.</p>';
  }

  const levelSnap = await firebase.database().ref('milestoneConfig/levels').once('value');
  const thresholds = levelSnap.val() || [];
  const level = determineLevel(packsOpened, thresholds);
  document.getElementById('level-number').innerText = level;
  document.getElementById('total-won').innerText = cardValue.toLocaleString();

  const historySnap = await firebase.database().ref('users/' + uid + '/unboxHistory').once('value');
  let totalSpent = 0;
  let rarest = null;
  historySnap.forEach(child => {
    const d = child.val();
    totalSpent += Math.max(0, (d.balanceBefore || 0) - (d.balanceAfter || 0));
    if (!rarest || (d.value || 0) > (rarest.value || 0)) {
      rarest = d;
    }
  });
  document.getElementById('total-spent').innerText = totalSpent.toLocaleString();
  const rareEl = document.getElementById('rarest-pull');
  if (rarest) {
    rareEl.innerHTML = `<img src="${rarest.image}" class="h-16 mx-auto mb-2"><p>${rarest.name} (${rarest.rarity})</p>`;
  } else {
    rareEl.textContent = 'No pulls yet.';
  }

  if (!isOwn) {
    document.querySelector('button[onclick="updateProfile()"]').classList.add('hidden');
    document.getElementById('current-password').parentElement.classList.add('hidden');
    document.getElementById('new-password').parentElement.classList.add('hidden');
    document.querySelector('button[onclick="changePassword()"]').classList.add('hidden');
  }
}

function setupSearch() {
  const searchInput = document.getElementById('user-search');
  if (!searchInput) return;
  searchInput.addEventListener('input', async e => {
    const q = e.target.value.trim();
    const list = document.getElementById('user-list');
    if (!list) return;
    if (!q) {
      list.innerHTML = '';
      return;
    }
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

function determineLevel(packs, thresholds) {
  if (!Array.isArray(thresholds) || thresholds.length === 0) {
    return Math.floor(packs / 10) + 1;
  }
  let lvl = 1;
  thresholds.forEach((t, idx) => {
    if (packs >= t) lvl = idx + 1;
  });
  return lvl;
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


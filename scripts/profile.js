// scripts/profile.js

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
  const levelInfo = determineLevel(packsOpened, thresholds);
  document.getElementById('level-number').innerText = levelInfo.level;
  document.getElementById('packs-opened').innerText = packsOpened.toLocaleString();
  document.getElementById('total-won').innerText = cardValue.toLocaleString();
  const progressEl = document.getElementById('level-progress');
  const progressText = document.getElementById('progress-text');
  if (progressEl) {
    let pct = 100;
    if (levelInfo.nextThreshold > levelInfo.prevThreshold) {
      pct = ((packsOpened - levelInfo.prevThreshold) / (levelInfo.nextThreshold - levelInfo.prevThreshold)) * 100;
      if (progressText) {
        const remaining = levelInfo.nextThreshold - packsOpened;
        progressText.textContent = `${remaining} packs to next level`;
      }
    } else if (progressText) {
      progressText.textContent = 'Max level achieved';
    }
    progressEl.style.width = pct + '%';
  }

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

function determineLevel(packs, levels) {
  if (!Array.isArray(levels) || levels.length === 0) {
    const level = Math.floor(packs / 10) + 1;
    const prev = (level - 1) * 10;
    const next = level * 10;
    return { level, prevThreshold: prev, nextThreshold: next };
  }
  let lvl = 1;
  let prev = 0;
  let next = null;
  levels.forEach((entry, idx) => {
    const t = typeof entry === 'object' ? entry.threshold : entry;
    if (packs >= t) {
      lvl = idx + 1;
      prev = t;
    } else if (next === null) {
      next = t;
    }
  });
  if (next === null) next = prev;
  return { level: lvl, prevThreshold: prev, nextThreshold: next };
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


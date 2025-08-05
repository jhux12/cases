// scripts/profile.js

document.addEventListener('DOMContentLoaded', () => {
  firebase.auth().onAuthStateChanged(user => {
    if (!user) return (window.location.href = 'auth.html');
    const uid = user.uid;

    const userRef = firebase.database().ref('users/' + uid);
    userRef.once('value').then(snap => {
      const data = snap.val() || {};
      document.getElementById('email').value = user.email;
      const usernameInput = document.getElementById('username-input');
      if (usernameInput && data.username) usernameInput.value = data.username;
      const initials = user.email ? user.email.substring(0,2).toUpperCase() : '??';
      document.getElementById('profile-pic').textContent = initials;
    });

    firebase.firestore().collection('leaderboard').doc(uid).get().then(doc => {
      const data = doc.data() || {};
      const badges = data.badges || [];
      const badgeContainer = document.getElementById('badge-container');
      if (badges.length === 0) {
        badgeContainer.innerHTML = '<p class="text-sm text-gray-400">No badges yet.</p>';
      } else {
        badgeContainer.innerHTML = badges.map(b => `<span class="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">${b}</span>`).join(' ');
      }
      const level = Math.floor((data.packsOpened || 0) / 10) + 1;
      document.getElementById('level-number').innerText = level;
      document.getElementById('total-won').innerText = (data.cardValue || 0).toLocaleString();
    });

    firebase.database().ref('users/' + uid + '/unboxHistory').once('value').then(snap => {
      let totalSpent = 0;
      let rarest = null;
      const order = ['common','uncommon','rare','ultra rare','legendary'];
      snap.forEach(child => {
        const d = child.val();
        totalSpent += Math.max(0, (d.balanceBefore || 0) - (d.balanceAfter || 0));
        const rarityIndex = order.indexOf((d.rarity || '').toLowerCase());
        if (!rarest || rarityIndex > order.indexOf((rarest.rarity || '').toLowerCase())) {
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
    });
  });
});

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


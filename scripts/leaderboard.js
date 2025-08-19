// scripts/leaderboard.js
// Weekly leaderboard with automatic reset and rewards

document.addEventListener('DOMContentLoaded', async () => {
  const tbody = document.getElementById('leaderboard-body');
  const topContainer = document.getElementById('top-three');
  const timerEl = document.getElementById('reset-timer');
  if (!tbody) return;

  const fs = firebase.firestore();
  const rtdb = firebase.database();

  // Award top players and reset stats if the week has ended
  async function handleWeeklyReset() {
    const metaRef = fs.collection('leaderboardMeta').doc('weekly');
    const now = new Date();
    let periodStart = now;
    const snap = await metaRef.get();
    if (snap.exists && snap.data().periodStart?.toDate) {
      periodStart = snap.data().periodStart.toDate();
    } else if (!snap.exists) {
      await metaRef.set({ periodStart: firebase.firestore.Timestamp.fromDate(now) });
    }

    let nextReset = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (now >= nextReset) {
      // Fetch top three players
      const topSnap = await fs
        .collection('leaderboard')
        .orderBy('cardValue', 'desc')
        .limit(3)
        .get();

      for (const doc of topSnap.docs) {
        const uid = doc.id;

        // Credit 500 coins
        await rtdb.ref('users/' + uid + '/balance').transaction((bal) => (bal || 0) + 500);

        // Increment win counter
        await fs.collection('leaderboard').doc(uid).set(
          { wins: firebase.firestore.FieldValue.increment(1) },
          { merge: true }
        );
      }

      // Reset packs and value for all players but keep win counts
      const allSnap = await fs.collection('leaderboard').get();
      const batch = fs.batch();
      allSnap.forEach((doc) => {
        batch.set(doc.ref, { packsOpened: 0, cardValue: 0 }, { merge: true });
      });
      await batch.commit();

      // Start new period
      await metaRef.set({ periodStart: firebase.firestore.Timestamp.fromDate(now) });
      nextReset = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    return nextReset;
  }

  // Display countdown timer
  function startTimer(nextReset) {
    if (!timerEl) return;

    function update() {
      const diff = nextReset - new Date();
      if (diff <= 0) {
        timerEl.textContent = 'Resetting soon...';
        return;
      }
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      timerEl.textContent = `Resets in ${days}d ${hours}h ${minutes}m`;
    }

    update();
    setInterval(update, 60 * 1000); // update every minute
  }

  // Render leaderboard
  async function loadLeaderboard() {
    const snap = await fs
      .collection('leaderboard')
      .orderBy('cardValue', 'desc')
      .limit(10)
      .get();

    let rank = 1;
    snap.forEach((doc) => {
      const data = doc.data();
      const wins = data.wins || 0;

      if (rank <= 3 && topContainer) {
        const medal = ['🥇', '🥈', '🥉'][rank - 1];
        const colors = [
          'from-yellow-300 to-yellow-500',
          'from-gray-300 to-gray-500',
          'from-orange-300 to-orange-500',
        ];
        topContainer.innerHTML += `
          <div class="flex flex-col items-center p-6 rounded-xl bg-gradient-to-br ${colors[rank - 1]} text-gray-900 font-semibold shadow-lg transform hover:scale-105 transition">
            <div class="text-4xl">${medal}</div>
            <div class="text-xl mt-2">${data.username || 'Anonymous'}</div>
            <div class="text-sm mt-1">Value: ${(data.cardValue || 0).toLocaleString()}</div>
            <div class="text-sm">Packs: ${data.packsOpened || 0}</div>
          </div>`;
      } else {
          tbody.innerHTML += `
            <tr class="border-b border-gray-200 hover:bg-gray-100 transition">
              <td class="py-2 px-4 text-center">${rank}</td>
              <td class="py-2 px-4">${data.username || 'Anonymous'}</td>
              <td class="py-2 px-4 text-center">${data.packsOpened || 0}</td>
              <td class="py-2 px-4 text-center">${(data.cardValue || 0).toLocaleString()}</td>
              <td class="py-2 px-4 text-center">${wins} Win${wins === 1 ? '' : 's'}</td>
            </tr>`;
      }
      rank++;
    });
  }

  const nextReset = await handleWeeklyReset();
  startTimer(nextReset);
  loadLeaderboard();
});

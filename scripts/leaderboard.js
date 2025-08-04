// scripts/leaderboard.js
// Fetch top players from Firestore and render leaderboard

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('leaderboard-body');
  if (!tbody) return;

  const db = firebase.firestore();
  db.collection('leaderboard')
    .orderBy('cardValue', 'desc')
    .limit(10)
    .get()
    .then((snap) => {
      let rank = 1;
      snap.forEach((doc) => {
        const data = doc.data();
        const badges = (data.badges || [])
          .map((b) => `<span class="bg-purple-600 text-white text-xs px-2 py-1 rounded-full mr-1">${b}</span>`) 
          .join('');
        tbody.innerHTML += `
          <tr class="border-b border-gray-700">
            <td class="py-2 px-2 text-center">${rank++}</td>
            <td class="py-2 px-2">${data.username || 'Anonymous'}</td>
            <td class="py-2 px-2 text-center">${data.packsOpened || 0}</td>
            <td class="py-2 px-2 text-center">${(data.cardValue || 0).toLocaleString()}</td>
            <td class="py-2 px-2">${badges}</td>
          </tr>`;
      });
    });
});

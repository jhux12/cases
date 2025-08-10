let wonderPicks = [];

function renderWonderPicks(list) {
  const container = document.getElementById('wonder-container');
  container.innerHTML = '';
  list.forEach(wp => {
    const price = parseFloat(wp.price) || 0;
    const priceLabel = price.toLocaleString();
    const cards = Object.values(wp.prizes || {}).slice(0,5);
    const cardImgs = cards.map(c => `<img src="${c.image}" class="w-10 h-14 object-contain rounded-md bg-black/40" />`).join('');
    container.innerHTML += `
      <div class="relative p-4 bg-gray-800/60 backdrop-blur rounded-xl shadow-lg hover:shadow-purple-500/20 transition-transform hover:scale-105">
        <img src="${wp.image}" alt="${wp.name}" class="w-full h-40 object-contain mx-auto mb-3 transform transition-transform duration-300 hover:scale-110" />
        <a href="wonder-pick.html?id=${wp.id}" class="open-button glow-button text-sm w-full block text-center mb-3">
          Open for ${priceLabel} <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-4 h-4 inline-block" />
        </a>
        <div class="flex justify-center gap-2 mb-3">${cardImgs}</div>
        <h3 class="text-center font-semibold">${wp.name}</h3>
      </div>
    `;
  });
}

function loadWonderPicks() {
  firebase.database().ref('wonderPicks').once('value').then(snap => {
    const data = snap.val() || {};
    wonderPicks = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    renderWonderPicks(wonderPicks);
  });
}

document.addEventListener('DOMContentLoaded', loadWonderPicks);

let wonderPicks = [];

function renderWonderPicks(list) {
  const container = document.getElementById('wonder-container');
  container.innerHTML = '';
  list.forEach(wp => {
    const price = parseFloat(wp.price) || 0;
    const priceLabel = price.toLocaleString();
    const cards = Object.values(wp.prizes || {}).slice(0,5);
    const cardImgs = cards.map(c => `<img src="${c.image}" class="w-10 h-14 object-contain rounded-md bg-black/40 border border-yellow-500/30" />`).join('');
    container.innerHTML += `
      <div class="relative group p-4 bg-black/40 backdrop-blur rounded-2xl border border-yellow-500/30 shadow-lg hover:shadow-yellow-500/40 transition-transform hover:scale-105">
        <span class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold text-black bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full">Exclusive</span>
        <img src="${wp.image}" alt="${wp.name}" class="w-full h-40 object-contain mx-auto mb-3 transform transition-transform duration-300 group-hover:scale-110" />
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

let wonderPicks = [];

function renderWonderPicks(list) {
  const container = document.getElementById('wonder-container');
  container.innerHTML = '';
  list.forEach(wp => {
    const price = parseFloat(wp.price) || 0;
    const priceLabel = price.toLocaleString();
    container.innerHTML += `
      <div class="relative p-4 bg-gray-800/60 backdrop-blur rounded-xl shadow-lg hover:shadow-purple-500/20 transition-transform hover:scale-105">
        <img src="${wp.image}" alt="${wp.name}" class="w-full h-40 object-contain mx-auto mb-4 transform transition-transform duration-300 hover:scale-110" />
        <h3 class="text-center font-semibold mb-3">${wp.name}</h3>
        <a href="wonder-pick.html?id=${wp.id}" class="open-button glow-button text-sm w-full block text-center">
          Open for ${priceLabel} <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-4 h-4 inline-block" />
        </a>
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

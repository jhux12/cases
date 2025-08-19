document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('hot-cards');
  if (!container || typeof firebase === 'undefined') return;

  const dbRef = firebase.database().ref('cases');
  dbRef.once('value').then(snap => {
    const data = snap.val() || {};
    const legendary = [];
    Object.values(data).forEach(pack => {
      (pack.prizes || []).forEach(prize => {
        if ((prize.rarity || '').toLowerCase() === 'legendary') {
          legendary.push(prize);
        }
      });
    });
    if (!legendary.length) return;

    const selected = legendary.sort(() => Math.random() - 0.5).slice(0, 6);
    selected.forEach((card, idx) => {
      const price = card.value ? Number(card.value).toLocaleString() : '0';
      const cardEl = document.createElement('div');
      cardEl.className = 'bg-white rounded-lg overflow-hidden shadow-md card-hover transition-all duration-300 flex-shrink-0 w-40 sm:w-auto';
      cardEl.innerHTML = `
        <img class="w-full h-48 object-contain p-4" src="${card.image}" alt="${card.name}">
        <div class="p-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-900 font-medium">${price}</span>
            <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="h-5 w-5 coin-icon" alt="Coins">
          </div>
        </div>`;
      container.appendChild(cardEl);
    });
  });
});

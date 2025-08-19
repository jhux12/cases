document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('hot-cards');
  if (!container || typeof firebase === 'undefined') return;

  const rarityColors = {
    common: '#a1a1aa',
    uncommon: '#4ade80',
    rare: '#60a5fa',
    ultrarare: '#c084fc',
    legendary: '#facc15'
  };
  const MAX_NAME_LENGTH = 15;
  const truncate = (text, len) =>
    text.length > len ? text.slice(0, len) + '\u2026' : text;

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
      const rarity = (card.rarity || 'common').toLowerCase().replace(/\s+/g, '');
      const color = rarityColors[rarity] || '#a1a1aa';
      const displayName = (card.name || '').toString();
      const truncatedName = truncate(displayName, MAX_NAME_LENGTH);
      const cardEl = document.createElement('div');
      cardEl.className = 'bg-white rounded-lg overflow-hidden shadow-md card-hover transition-all duration-300 flex-shrink-0 w-40 border-2';
      cardEl.style.borderColor = color;
      cardEl.innerHTML = `
        <img class="w-full h-48 object-contain p-4" src="${card.image}" alt="${card.name}">
        <div class="p-4">
          <p class="text-sm font-semibold text-center truncate mb-2 text-black dark:text-white" title="${displayName}">${truncatedName}</p>
          <div class="flex items-center justify-center gap-1">
            <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="h-5 w-5 coin-icon" alt="Coins">
            <span class="text-gray-900 font-medium">${price}</span>
          </div>
        </div>`;
      container.appendChild(cardEl);
    });
  });
});

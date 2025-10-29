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
  const MAX_NAME_LENGTH = 18;
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

    const selected = legendary.sort(() => Math.random() - 0.5).slice(0, 8);
    selected.forEach((card) => {
      const price = card.value ? Number(card.value).toLocaleString() : '0';
      const rarity = (card.rarity || 'common').toLowerCase().replace(/\s+/g, '');
      const color = rarityColors[rarity] || '#a1a1aa';
      const displayName = (card.name || '').toString();
      const truncatedName = truncate(displayName, MAX_NAME_LENGTH);
      const cardEl = document.createElement('div');
      cardEl.className = 'relative flex-none w-48 md:w-full snap-start overflow-hidden rounded-xl bg-white shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl border-2';
      cardEl.style.borderColor = color;
      cardEl.innerHTML = `
        <img src="${card.image}" alt="${displayName}" class="w-full h-56 sm:h-64 object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
        <div class="absolute bottom-3 left-3 right-3 text-white">
          <p class="text-sm font-semibold truncate" title="${displayName}">${truncatedName}</p>
          <div class="flex items-center mt-1 text-xs">
            <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" class="w-4 h-4 mr-1" alt="Coins">
            <span>${price}</span>
          </div>
        </div>`;
      container.appendChild(cardEl);
    });
  });
});

// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('hot-items-spinner');
  if (!track || typeof firebase === 'undefined') return;

  const rarityColors = {
    common: '#a1a1aa',
    uncommon: '#4ade80',
    rare: '#60a5fa',
    ultrarare: '#c084fc',
    ultra: '#c084fc',
    legendary: '#facc15',
    mythic: '#f97316'
  };

  const rarityLabels = {
    common: 'Common',
    uncommon: 'Uncommon',
    rare: 'Rare',
    ultrarare: 'Ultra Rare',
    ultra: 'Ultra Rare',
    legendary: 'Legendary',
    mythic: 'Mythic'
  };

  const highRarities = new Set(['legendary', 'ultrarare', 'ultra', 'mythic']);
  const MAX_NAME_LENGTH = 22;

  const truncate = (text, len) =>
    text.length > len ? text.slice(0, len).trimEnd() + '\u2026' : text;

  const escapeHtml = (text = '') =>
    String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const normaliseRarity = (value = '') => value.toString().toLowerCase().replace(/[^a-z]/g, '');

  const formatValue = (value) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(numeric, 0).toLocaleString() : '0';
  };

  const hexToRgba = (hex, alpha = 1) => {
    if (typeof hex !== 'string') {
      return `rgba(99, 102, 241, ${alpha})`;
    }

    const value = hex.replace('#', '').trim();
    if (![3, 6].includes(value.length)) {
      return `rgba(99, 102, 241, ${alpha})`;
    }

    const full = value.length === 3 ? value.split('').map((ch) => ch + ch).join('') : value;
    const int = parseInt(full, 16);
    if (Number.isNaN(int)) {
      return `rgba(99, 102, 241, ${alpha})`;
    }

    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const buildTile = (prize) => {
    const rawName = (prize.name || 'Mystery Pull').toString();
    const rarityKey = normaliseRarity(prize.rarity) || 'legendary';
    const price = formatValue(prize.value);
    const color = rarityColors[rarityKey] || rarityColors.legendary;
    const rarityLabel = rarityLabels[rarityKey] || rarityLabels.legendary;
    const image = typeof prize.image === 'string' && prize.image.trim() ? prize.image : 'https://via.placeholder.com/240x240?text=Card';
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.rarity = rarityKey === 'ultra' ? 'ultrarare' : rarityKey;
    tile.style.setProperty('--win-color', color);
    tile.style.borderColor = hexToRgba(color, 0.45);
    tile.style.boxShadow = `0 22px 38px ${hexToRgba(color, 0.22)}`;
    tile.innerHTML = `
      <img src="${image}" alt="${escapeHtml(rawName)}" loading="lazy" />
      <div class="tile-info">
        <div class="name" title="${escapeHtml(rawName)}">${escapeHtml(truncate(rawName, MAX_NAME_LENGTH))}</div>
        <div class="price">
          <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/diamond.png?alt=media&token=244f4b80-1832-4c7c-89da-747a1f8457ff" alt="Gems" />
          <span>${price}</span>
        </div>
        <span class="pill ${rarityKey === 'ultra' ? 'ultrarare' : rarityKey}">${rarityLabel}</span>
      </div>`;
    return tile;
  };

  const initSpinner = (items) => {
    if (!items.length) return;
    const fragment = document.createDocumentFragment();
    const renderItems = [...items, ...items];
    renderItems.forEach((prize) => fragment.appendChild(buildTile(prize)));
    track.innerHTML = '';
    track.appendChild(fragment);
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';

    if (items.length <= 1) {
      return;
    }

    let index = 0;
    const stepToNext = () => {
      const tile = track.querySelector('.tile');
      if (!tile) return;
      const rect = tile.getBoundingClientRect();
      const styles = getComputedStyle(tile);
      const gap = parseFloat(styles.marginLeft) + parseFloat(styles.marginRight);
      const step = rect.width + (Number.isFinite(gap) ? gap : 0);
      index += 1;
      track.style.transition = 'transform 0.6s ease';
      track.style.transform = `translateX(-${index * step}px)`;

      if (index >= items.length) {
        setTimeout(() => {
          track.style.transition = 'none';
          track.style.transform = 'translateX(0)';
          index = 0;
        }, 600);
      }
    };

    setInterval(stepToNext, 3200);
  };

  firebase
    .database()
    .ref('cases')
    .once('value')
    .then((snap) => {
      const data = snap.val() || {};
      const pulls = [];

      Object.values(data).forEach((pack = {}) => {
        (pack.prizes || []).forEach((prize = {}) => {
          const rarityKey = normaliseRarity(prize.rarity);
          if (highRarities.has(rarityKey)) {
            pulls.push(prize);
          }
        });
      });

      if (!pulls.length) return;

      const uniqueByName = [];
      const seen = new Set();
      pulls.forEach((prize) => {
        const key = `${normaliseRarity(prize.rarity)}|${(prize.name || '').toString().toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueByName.push(prize);
        }
      });

      const selected = uniqueByName
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.max(6, Math.min(uniqueByName.length, 12)));

      initSpinner(selected);
    })
    .catch((err) => {
      console.error('Failed to load hot items', err);
    });
});

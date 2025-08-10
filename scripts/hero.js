// Demo spinner that fetches pack prizes and always lands on a rare card

document.addEventListener('DOMContentLoaded', () => {
  const CARD_W = 220;
  const GAP = 16;
  const TILE_W = CARD_W + GAP;

  const track = document.getElementById('spinTrack');
  const cards = [];
  let tiles = [];

  let offset = 0;
  let baseSpeed = 0.6;
  let speed = baseSpeed;
  let demoLock = false;
  let lastTs = performance.now();
  let tilesCount = 0;
  let trackPx = 0;

  function buildTrack(prizes) {
    const tripled = [...prizes, ...prizes, ...prizes];
    tripled.forEach(p => {
      const tile = document.createElement('div');
      tile.className = 'card select-none';
      tile.style.flex = '0 0 auto';
      tile.style.width = CARD_W + 'px';
      tile.innerHTML = `<img src="${p.img}" alt="" loading="lazy" draggable="false">`;
      track.appendChild(tile);
      cards.push(p);
    });
    tiles = Array.from(track.children);
    tilesCount = tiles.length;
    trackPx = tilesCount * TILE_W;
  }

  function loop(ts) {
    const dt = ts - lastTs;
    lastTs = ts;
    offset -= speed * dt;
    if (offset < -trackPx) offset += trackPx;
    track.style.transform = `translateX(${offset}px)`;
    requestAnimationFrame(loop);
  }

  function centerTargetIndex(idx) {
    const viewport = track.parentElement.getBoundingClientRect();
    const heroCenterX = viewport.width / 2;
    const tileCenterX = idx * TILE_W + CARD_W / 2;
    return heroCenterX - tileCenterX;
  }

  async function demoOpen() {
    if (demoLock) return;
    demoLock = true;

    const rares = cards
      .map((c, i) => ({ i, rarity: c.rarity }))
      .filter(o => o.rarity === 'rare');
    if (!rares.length) {
      demoLock = false;
      return;
    }
    const idx = rares[Math.floor(Math.random() * rares.length)].i;

    speed = baseSpeed * 8;
    await new Promise(r => setTimeout(r, 600));

    const targetOffset = centerTargetIndex(idx);
    const startOffset = offset;
    const delta = startOffset - targetOffset;
    const duration = 1600;
    const start = performance.now();
    speed = 0;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(ts) {
      const t = Math.min(1, (ts - start) / duration);
      const eased = easeOutCubic(t);
      offset = startOffset - delta * eased;
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        tiles.forEach(tile => tile.classList.remove('glow'));
        tiles[idx % tiles.length].classList.add('glow');
        setTimeout(() => { speed = baseSpeed; }, 1200);
        demoLock = false;
      }
    }
    requestAnimationFrame(animate);
  }

  function scheduleDemo() {
    demoOpen();
    setInterval(demoOpen, 5000);
  }

  function fetchPrizes() {
    return firebase.database().ref('cases').once('value').then(snap => {
      const data = snap.val() || {};
      const prizes = [];
      Object.values(data).forEach(caseInfo => {
        (caseInfo.prizes || []).forEach(p => {
          const rarity = (p.rarity || '').toLowerCase();
          prizes.push({ img: p.image, rarity });
        });
      });
      return prizes;
    });
  }

  fetchPrizes().then(prizes => {
    if (!prizes.length) return;
    buildTrack(prizes.slice(0, 12));
    requestAnimationFrame(loop);
    scheduleDemo();
  });
});


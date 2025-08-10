import { initSpinner } from './spinner.js';

/** Fetch prizes from Firebase and initialise hero spinner */
document.addEventListener('DOMContentLoaded', async () => {
  const viewport = document.querySelector('.spin-viewport');
  const track = document.getElementById('spinTrack');
  if (!viewport || !track) return;

  async function fetchPrizes() {
    const snap = await firebase.database().ref('cases').once('value');
    const data = snap.val() || {};
    const prizes = [];
    Object.values(data).forEach(caseInfo => {
      (caseInfo.prizes || []).forEach(p => {
        prizes.push({ id: p.id || '', name: p.name, imageUrl: p.image, rarity: p.rarity });
      });
    });
    return prizes.slice(0, 12); // limit for hero demo
  }

  const currentPrizes = await fetchPrizes();
  const api = await initSpinner(viewport, track, currentPrizes);
  api.demo.start(6000);
});

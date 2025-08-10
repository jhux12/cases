import { renderSpinner, spinToPrize } from './spinner.js';

async function initHeroSpinner() {
  const container = document.getElementById('spinner-container-hero');
  if (!container) return;

  const snap = await firebase.database().ref('cases').once('value');
  const data = snap.val() || {};

  const allPrizes = [];
  const legendaryPrizes = [];

  Object.values(data).forEach(c => {
    (c.prizes || []).forEach(p => {
      allPrizes.push(p);
      if ((p.rarity || '').toLowerCase() === 'legendary') {
        legendaryPrizes.push(p);
      }
    });
  });

  if (!allPrizes.length || !legendaryPrizes.length) return;

  function randomPrize() {
    return allPrizes[Math.floor(Math.random() * allPrizes.length)];
  }

  async function spin() {
    const winningPrize = legendaryPrizes[Math.floor(Math.random() * legendaryPrizes.length)];
    const spinnerPrizes = [];
    for (let i = 0; i < 30; i++) {
      spinnerPrizes.push(randomPrize());
    }
    spinnerPrizes[15] = winningPrize;

    renderSpinner(spinnerPrizes, winningPrize, false, 'hero');

    // Ensure all prize images are loaded before measuring positions
    const images = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      images.map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise(resolve => {
              img.onload = img.onerror = resolve;
            })
      )
    );

    await spinToPrize(() => {}, false, 'hero');
    setTimeout(spin, 2500);
  }

  spin();
}

document.addEventListener('DOMContentLoaded', initHeroSpinner);

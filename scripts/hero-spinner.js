import { renderSpinner, spinToPrize } from './spinner.js';

async function initHeroSpinner() {
  const container = document.getElementById('spinner-container-hero');
  if (!container) return;

  const snap = await firebase.database().ref('cases').once('value');
  const data = snap.val() || {};

  let heatCheck = null;
  Object.values(data).forEach(c => {
    if ((c.name || '').toLowerCase() === 'heat check') {
      heatCheck = c;
    }
  });
  if (!heatCheck) return;

  const packImgEl = document.getElementById('hero-pack-image');
  if (packImgEl) packImgEl.src = heatCheck.image || '';

  const allPrizes = Object.values(heatCheck.prizes || {});
  const legendaryPrizes = allPrizes.filter(p => (p.rarity || '').toLowerCase() === 'legendary');
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

    const prize = await spinToPrize(() => {}, false, 'hero');
    await demoAnimation(prize);
    setTimeout(spin, 1000);
  }

  spin();
}

async function demoAnimation(prize) {
  const border = document.getElementById('spinner-border-hero');
  const wrapper = border?.parentElement;
  const sellDest = document.getElementById('demo-sell-dest');
  const shipDest = document.getElementById('demo-ship-dest');
  const labelEl = document.getElementById('demo-label');
  if (!wrapper || !sellDest || !shipDest || !prize || !labelEl) return;

  await animateTo(shipDest, 'Ship to you');
  await animateTo(sellDest, 'Sell back for coins');

  function animateTo(destEl, text) {
    return new Promise(resolve => {
      const card = document.createElement('img');
      card.src = prize.image || '';
      card.className = 'demo-card absolute rounded-lg shadow-lg';
      const width = 80;
      const height = 100;
      const wrapperRect = wrapper.getBoundingClientRect();
      card.style.width = `${width}px`;
      card.style.height = `${height}px`;
      card.style.left = `${wrapperRect.width / 2 - width / 2}px`;
      card.style.top = `${wrapperRect.height / 2 - height / 2}px`;
      card.style.opacity = '1';
      wrapper.appendChild(card);

      labelEl.textContent = text;
      labelEl.style.opacity = '1';
      destEl.classList.add('animate-pulse');

      requestAnimationFrame(() => {
        const destRect = destEl.getBoundingClientRect();
        const latestWrapperRect = wrapper.getBoundingClientRect();
        const dx = destRect.left + destRect.width / 2 - (latestWrapperRect.left + latestWrapperRect.width / 2);
        const dy = destRect.top + destRect.height / 2 - (latestWrapperRect.top + latestWrapperRect.height / 2);
        card.style.transform = `translate(${dx}px, ${dy}px) scale(0.5)`;
        card.style.opacity = '0';
      });

      card.addEventListener(
        'transitionend',
        () => {
          destEl.classList.remove('animate-pulse');
          labelEl.style.opacity = '0';
          card.remove();
          setTimeout(resolve, 500);
        },
        { once: true }
      );
    });
  }
}

document.addEventListener('DOMContentLoaded', initHeroSpinner);

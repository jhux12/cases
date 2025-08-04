(() => {
  const CAROUSEL_ID = 'recent-wins-carousel';
  const SCROLL_SPEED = 0.5; // pixels per frame

  const rarityGlow = (rarity = '') => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return 'shadow-[0_0_20px_4px_rgba(255,215,0,0.5)] border-yellow-400';
      case 'ultra rare':
        return 'shadow-[0_0_16px_3px_rgba(186,85,211,0.5)] border-purple-500';
      case 'rare':
        return 'shadow-[0_0_12px_2px_rgba(30,144,255,0.5)] border-blue-500';
      case 'uncommon':
        return 'shadow-[0_0_8px_1px_rgba(50,205,50,0.4)] border-green-500';
      default:
        return 'shadow-[0_0_6px_1px_rgba(255,255,255,0.1)] border-gray-700';
    }
  };

  const createCard = (prize) => {
    const card = document.createElement('div');
    card.className = `min-w-[120px] md:min-w-[160px] bg-[#12121b] p-3 rounded-xl border ${rarityGlow(prize.rarity)} text-center flex-shrink-0 mx-2 transform transition-transform duration-200 hover:scale-105`;

    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'relative w-[90px] h-[90px] md:w-[120px] md:h-[120px] mx-auto overflow-hidden rounded-md cursor-pointer';

    const prizeImg = document.createElement('img');
    prizeImg.src = prize.image;
    prizeImg.alt = prize.name;
    prizeImg.className = 'absolute inset-0 w-full h-full object-contain transition-opacity duration-300';
    imgWrapper.appendChild(prizeImg);

    if (prize.packImage) {
      const packImg = document.createElement('img');
      packImg.src = prize.packImage;
      packImg.alt = `${prize.name} pack`;
      packImg.className = 'absolute inset-0 w-full h-full object-contain transition-opacity duration-300 opacity-0';

      const toggle = () => {
        const showingPack = packImg.classList.toggle('opacity-0');
        prizeImg.classList.toggle('opacity-0', !showingPack);
      };

      const prefersTouch = window.matchMedia('(hover: none)').matches;

      if (prefersTouch) {
        imgWrapper.addEventListener('click', toggle);
      } else {
        imgWrapper.addEventListener('mouseenter', toggle);
        imgWrapper.addEventListener('mouseleave', toggle);
      }

      imgWrapper.appendChild(packImg);
    }

    card.appendChild(imgWrapper);

    const nameEl = document.createElement('div');
    nameEl.className = 'text-sm text-white text-center leading-tight mt-2 truncate w-[90px] md:w-[120px] mx-auto';
    nameEl.title = prize.name;
    nameEl.textContent = prize.name;
    card.appendChild(nameEl);

    const caseEl = document.createElement('div');
    caseEl.className = 'text-xs text-gray-400 text-center italic';
    caseEl.textContent = `From: ${prize.caseName || 'Mystery Pack'}`;
    card.appendChild(caseEl);

    return card;
  };

  const displayLiveWins = (prizes) => {
    const carousel = document.getElementById(CAROUSEL_ID);
    if (!carousel) return;

    carousel.innerHTML = '';

    const selected = [...prizes]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    const loopPrizes = [...selected, ...selected];
    loopPrizes.forEach((prize) => carousel.appendChild(createCard(prize)));

    startScroll(carousel);
  };

  const startScroll = (container) => {
    let paused = false;

    const step = () => {
      if (!paused) {
        container.scrollLeft += SCROLL_SPEED;
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
          container.scrollLeft = 0;
        }
      }
      window.requestAnimationFrame(step);
    };

    container.addEventListener('mouseenter', () => (paused = true));
    container.addEventListener('mouseleave', () => (paused = false));
    container.addEventListener('touchstart', () => (paused = true), { passive: true });
    container.addEventListener('touchend', () => (paused = false));

    step();
  };

  const fetchHighTierPrizes = () => {
    const dbRef = firebase.database().ref('cases');
    dbRef.once('value').then((snap) => {
      const data = snap.val() || {};
      const highTier = [];

      Object.values(data).forEach((caseInfo) => {
        const caseName = caseInfo.name || 'Mystery Pack';
        const packImage = caseInfo.image || '';
        (caseInfo.prizes || []).forEach((p) => {
          const rarity = (p.rarity || '').toLowerCase();
          if (rarity === 'ultra rare' || rarity === 'legendary') {
            highTier.push({
              ...p,
              caseName,
              packImage,
            });
          }
        });
      });

      if (highTier.length) {
        displayLiveWins(highTier);
      }
    });
  };

  document.addEventListener('DOMContentLoaded', fetchHighTierPrizes);
})();


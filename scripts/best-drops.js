document.addEventListener('DOMContentLoaded', () => {
  const dropsGrid = document.getElementById('best-drops-grid');
  const ticker = document.getElementById('drop-ticker');
  const tickerText = ticker?.querySelector('.ticker-text');
  const hypeFill = document.getElementById('hype-meter-fill');
  const hypeLabel = document.getElementById('hype-meter-label');
  const shuffleButton = document.getElementById('shuffle-drops');
  const boostButton = document.getElementById('boost-meter');

  if (!dropsGrid) return;

  const dropData = [
    {
      title: 'Pikachu VMAX (Secret)',
      from: 'Pika Pika',
      odds: '1 in 480 odds',
      value: '+420 gems',
      avg: '$118 average pull',
      streak: '3 pulls today',
      cardImg: 'https://tcgplayer-cdn.tcgplayer.com/product/284302_in_1000x1000.jpg',
      packImg:
        'https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Pack%20Images%2FUntitled%20design%20(27).png?alt=media&token=27661ed2-182e-49d5-a635-f07d19410001',
      rarity: 'Secret rare',
      hype: 72,
      cheers: 184
    },
    {
      title: "Pikachu (Secret) SM",
      from: 'Pika Pika',
      odds: '1 in 720 odds',
      value: '+260 gems',
      avg: '$94 average pull',
      streak: 'New this hour',
      cardImg: 'https://tcgplayer-cdn.tcgplayer.com/product/201352_in_1000x1000.jpg',
      packImg:
        'https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Pack%20Images%2FUntitled%20design%20(27).png?alt=media&token=27661ed2-182e-49d5-a635-f07d19410001',
      rarity: 'Sun & Moon',
      hype: 64,
      cheers: 132
    },
    {
      title: "N's Reshiram",
      from: 'Twin Dragons',
      odds: '1 in 320 odds',
      value: '+300 gems',
      avg: '$102 average pull',
      streak: 'Hot streak',
      cardImg: 'https://boxed.gg/_next/image?url=https%3A%2F%2Fproduct-images.tcgplayer.com%2F623594.jpg&w=640&q=75',
      packImg:
        'https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/Pack%20Images%2FChatGPT_Image_Aug_10__2025__11_20_09_PM-removebg-preview.png?alt=media&token=34a17fd5-2a05-4c2c-899c-c4ac0484a152',
      rarity: 'Legendary rare',
      hype: 70,
      cheers: 146
    }
  ];

  const tickerMessages = [
    'Nova just cheered a +420g Pikachu VMAX and boosted the hype meter.',
    'Kayden sent sparklers for a Twin Dragons pull – the crowd is watching.',
    'Community wants a rerun of the 1/720 Pikachu (Secret) SM – keep cheering!',
    "Aria’s N’s Reshiram streak is live for another 15 minutes.",
    'Mika stacked 10 cheers in a row and unlocked the neon spotlight.'
  ];

  const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  const renderDrops = data => {
    dropsGrid.innerHTML = data
      .map(
        (drop, index) => `
        <article class="best-drop-card frosted-panel rounded-2xl border border-slate-800/70" data-drop-index="${index}">
          <div class="best-drop-card-glow"></div>
          <div class="flex items-center justify-between text-[12px] text-slate-300">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="best-drop-chip">${drop.rarity}</span>
              <span class="best-drop-chip best-drop-chip-soft">${drop.odds}</span>
            </div>
            <span class="best-drop-value">${drop.value}</span>
          </div>
          <div class="flex items-center gap-4 mt-4 drop-visual-wrapper">
            <div class="best-drop-visual">
              <img class="drop-card" src="${drop.cardImg}" alt="${drop.title}">
              <img class="drop-pack" src="${drop.packImg}" alt="${drop.from} pack">
              <div class="drop-spotlight"></div>
            </div>
            <div class="flex-1 space-y-2">
              <div>
                <h3 class="text-lg font-semibold text-white leading-tight">${drop.title}</h3>
                <p class="text-sm text-slate-300">From: ${drop.from}</p>
              </div>
              <div class="drop-hype-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${drop.hype}">
                <div class="drop-hype-fill" style="width:${drop.hype}%"></div>
              </div>
              <div class="flex items-center justify-between text-[12px] text-slate-300">
                <span><i class="fa-solid fa-wand-magic-sparkles text-cyan-300"></i> ${drop.avg}</span>
                <span class="drop-stat-chip"><i class="fa-regular fa-clock"></i> ${drop.streak}</span>
              </div>
              <div class="flex items-center gap-2">
                <button class="cheer-button" data-cheer="${index}">
                  <i class="fa-solid fa-fire-flame-curved"></i>
                  Cheer
                  <span class="cheer-count" data-cheer-count="${index}">${drop.cheers}</span>
                </button>
                <span class="drop-stat-chip subtle-chip"><i class="fa-solid fa-bolt"></i> Hype ${drop.hype}%</span>
              </div>
            </div>
          </div>
        </article>
      `
      )
      .join('');
  };

  const updateMeter = () => {
    if (!hypeFill || !hypeLabel) return;
    const averageHype = Math.round(
      dropData.reduce((sum, drop) => sum + drop.hype, 0) / dropData.length
    );
    hypeFill.style.width = `${averageHype}%`;
    hypeLabel.textContent = `${averageHype}% charged`;
  };

  const updateCard = index => {
    const card = dropsGrid.querySelector(`[data-drop-index="${index}"]`);
    if (!card) return;
    const hypeFillBar = card.querySelector('.drop-hype-fill');
    const cheerCount = card.querySelector(`[data-cheer-count="${index}"]`);
    if (hypeFillBar) hypeFillBar.style.width = `${dropData[index].hype}%`;
    if (cheerCount) cheerCount.textContent = dropData[index].cheers;
    const hypeChip = card.querySelector('.subtle-chip');
    if (hypeChip) hypeChip.innerHTML = `<i class="fa-solid fa-bolt"></i> Hype ${dropData[index].hype}%`;
  };

  const cheer = index => {
    dropData[index].cheers += 1;
    dropData[index].hype = Math.min(100, dropData[index].hype + 4);
    updateCard(index);
    updateMeter();
    const card = dropsGrid.querySelector(`[data-drop-index="${index}"]`);
    if (card) {
      card.classList.add('cheered');
      setTimeout(() => card.classList.remove('cheered'), 450);
    }
  };

  const bindCheerButtons = () => {
    document.querySelectorAll('[data-cheer]').forEach(button => {
      button.addEventListener('click', () => cheer(Number(button.dataset.cheer)));
    });
  };

  const cycleTicker = (() => {
    let tickerIndex = 0;
    return () => {
      if (!tickerText) return;
      tickerText.classList.add('ticker-fade');
      setTimeout(() => {
        tickerText.textContent = tickerMessages[tickerIndex];
        tickerText.classList.remove('ticker-fade');
      }, 220);
      tickerIndex = (tickerIndex + 1) % tickerMessages.length;
    };
  })();

  const setSpotlight = (() => {
    let spotlightIndex = 0;
    return index => {
      const cards = dropsGrid.querySelectorAll('.best-drop-card');
      cards.forEach(card => card.classList.remove('is-spotlight'));
      spotlightIndex = typeof index === 'number' ? index : (spotlightIndex + 1) % cards.length;
      const target = dropsGrid.querySelector(`[data-drop-index="${spotlightIndex}"]`);
      if (target) target.classList.add('is-spotlight');
    };
  })();

  shuffleButton?.addEventListener('click', () => {
    shuffleArray(dropData);
    renderDrops(dropData);
    bindCheerButtons();
    setSpotlight(0);
  });

  boostButton?.addEventListener('click', () => {
    dropData.forEach(drop => {
      drop.hype = Math.min(100, drop.hype + 6);
    });
    dropData.sort((a, b) => b.hype - a.hype);
    renderDrops(dropData);
    bindCheerButtons();
    updateMeter();
    setSpotlight(0);
  });

  renderDrops(dropData);
  bindCheerButtons();
  updateMeter();
  setSpotlight(0);
  cycleTicker();
  setInterval(cycleTicker, 3400);
  setInterval(() => setSpotlight(), 6000);
});

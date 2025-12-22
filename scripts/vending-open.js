(() => {
  const firestore = firebase.firestore();
  const auth = firebase.auth();

  const machineName = document.getElementById('machine-name');
  const machineNamePill = document.getElementById('machine-name-pill');
  const machineDescription = document.getElementById('machine-description');
  const machinePrice = document.getElementById('machine-price');
  const openLabel = document.getElementById('open-label');
  const gemBalance = document.querySelector('#gem-balance span');
  const machineStage = document.getElementById('machine-stage');
  const machineImage = document.getElementById('machine-image');
  const openingOverlay = document.getElementById('opening-overlay');
  const overlayImage = document.getElementById('hit-overlay-image');
  const rarityEls = {
    common: document.getElementById('rarity-common'),
    rare: document.getElementById('rarity-rare'),
    epic: document.getElementById('rarity-epic'),
    legendary: document.getElementById('rarity-legendary')
  };
  const rarityLabels = {
    common: document.getElementById('rarity-common-label'),
    rare: document.getElementById('rarity-rare-label'),
    epic: document.getElementById('rarity-epic-label'),
    legendary: document.getElementById('rarity-legendary-label')
  };

  const openBtn = document.getElementById('open-btn');
  const bumpBtn = document.getElementById('bump-btn');

  const fairBtn = document.getElementById('fair-btn');
  const fairModal = document.getElementById('fair-modal');
  const fairClose = document.getElementById('fair-close');
  const fairSave = document.getElementById('fair-save');

  const toastEl = document.getElementById('toast');

  const defaults = { common: 40, rare: 30, epic: 20, legendary: 10 };
  const fallbackImage = 'https://placehold.co/400x400/0b1224/94a3b8?text=Reward';
  let currentMachine = null;
  let unsubscribeMachine = null;
  let currentUser = null;
  let currentGems = 0;
  let hitTimer = null;
  let cachedRarities = defaults;
  let cachedItems = {};

  const defaultItems = {
    common: [
      { name: 'Starter Bundle', weight: 1, image: fallbackImage },
      { name: 'Warm-up Pack', weight: 1, image: fallbackImage },
      { name: 'Basic Crate', weight: 1, image: fallbackImage },
    ],
    rare: [
      { name: 'Rare Neon Case', weight: 1.5, image: fallbackImage },
      { name: 'Holo Sticker Pack', weight: 1, image: fallbackImage },
    ],
    epic: [
      { name: 'Epic Hardware Drop', weight: 2, image: fallbackImage },
      { name: 'Mythic Blueprint', weight: 1, image: fallbackImage },
    ],
    legendary: [
      { name: 'Legendary Skin', weight: 2.5, image: fallbackImage },
      { name: 'Ultra Grail', weight: 1, image: fallbackImage },
    ]
  };

  const rarityWidth = (value) => `${Math.max(0, Number(value) || 0)}%`;

  const showToast = (message) => {
    toastEl.textContent = message;
    toastEl.classList.remove('opacity-0', 'pointer-events-none');
    toastEl.classList.add('opacity-100');
    setTimeout(() => {
      toastEl.classList.add('opacity-0');
      toastEl.classList.add('pointer-events-none');
    }, 1800);
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) return '—';
    return `${Number(price).toLocaleString()} 💎`;
  };

  const applyRarities = (rarities = {}) => {
    const data = { ...defaults, ...rarities };
    Object.entries(data).forEach(([key, value]) => {
      if (rarityEls[key]) rarityEls[key].style.width = rarityWidth(value);
      if (rarityLabels[key]) rarityLabels[key].textContent = `${key.charAt(0).toUpperCase() + key.slice(1)} - ${rarityWidth(value)}`;
    });
  };

  const pickRarity = (rarities = {}) => {
    const entries = Object.entries({ ...defaults, ...rarities }).map(([key, value]) => [key, Math.max(0, Number(value) || 0)]);
    const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1;
    let roll = Math.random() * total;
    for (const [key, value] of entries) {
      if ((roll -= value) <= 0) return key;
    }
    return entries[0][0] || 'common';
  };

  const setHitDisplay = (rarity, item) => {
    if (overlayImage) {
      overlayImage.src = item?.image || fallbackImage;
      overlayImage.alt = item?.name || `${rarity} hit`;
    }
  };

  const normalizePool = (pool = []) => {
    return (Array.isArray(pool) ? pool : [])
      .map((entry) => {
        if (typeof entry === 'string') return { name: entry, weight: 1, image: fallbackImage };
        return {
          name: entry?.name || 'Mystery hit',
          weight: Math.max(0.0001, Number(entry?.weight) || 1),
          image: entry?.image || fallbackImage,
        };
      })
      .filter((entry) => entry.name);
  };

  const pickItemFromPool = (pool = []) => {
    const normalized = normalizePool(pool);
    if (!normalized.length) return { name: 'Mystery hit', weight: 1 };
    const total = normalized.reduce((acc, cur) => acc + cur.weight, 0) || 1;
    let roll = Math.random() * total;
    for (const item of normalized) {
      if ((roll -= item.weight) <= 0) return item;
    }
    return normalized[0];
  };

  const runHitCycle = () => {
    const pools = { ...defaultItems, ...cachedItems };
    const choosePool = (rarity) => {
      const basePool = normalizePool(pools[rarity])?.length ? pools[rarity] : defaultItems[rarity];
      const normalized = normalizePool(basePool);
      const withImages = normalized.filter((entry) => entry.image);
      return withImages.length ? withImages : basePool;
    };
    const rarity = pickRarity(cachedRarities);
    const item = pickItemFromPool(choosePool(rarity));
    setHitDisplay(rarity, item);
  };

  const startHitCycle = (rarities = {}, items = {}) => {
    cachedRarities = { ...defaults, ...(rarities || {}) };
    cachedItems = items || {};
    if (hitTimer) clearInterval(hitTimer);
    runHitCycle();
    hitTimer = setInterval(runHitCycle, 2600);
  };

  const toggleOpeningOverlay = (state) => {
    if (!openingOverlay) return;
    if (state) {
      openingOverlay.classList.remove('opacity-0', 'pointer-events-none');
      machineStage?.classList.add('ring-2', 'ring-cyan-400/50', 'shadow-[0_0_45px_rgba(34,211,238,0.35)]');
    } else {
      openingOverlay.classList.add('opacity-0', 'pointer-events-none');
      machineStage?.classList.remove('ring-2', 'ring-cyan-400/50', 'shadow-[0_0_45px_rgba(34,211,238,0.35)]');
    }
  };

  const applyMachine = (machine) => {
    currentMachine = machine;
    const rarities = machine?.rarities || {};

    machineName.textContent = machine?.name || 'Vending machine';
    machineNamePill.textContent = machine?.name || 'Vending machine';
    machineDescription.textContent = machine?.description || 'Open this machine to see the live legendary and epic spotlights.';
    machinePrice.textContent = formatPrice(machine?.price);
    openLabel.textContent = `Open for ${formatPrice(machine?.price)}`;
    if (machineImage) {
      machineImage.src = machine?.image || 'https://placehold.co/800x900/0b1224/94a3b8?text=Vending+Machine';
      machineImage.alt = machine?.name || 'Vending machine';
    }

    applyRarities(rarities);
    startHitCycle(rarities, machine?.items || {});
  };

  const loadMachine = (id) => {
    if (!id) {
      applyMachine(null);
      showToast('Missing vending machine id');
      return;
    }

    if (unsubscribeMachine) unsubscribeMachine();

    unsubscribeMachine = firestore
      .collection('vendingMachines')
      .doc(id)
      .onSnapshot(
        (doc) => {
          if (!doc.exists) {
            showToast('Machine not found');
            return;
          }
          applyMachine({ id: doc.id, ...(doc.data() || {}) });
        },
        () => showToast('Unable to load machine')
      );
  };

  const fetchGems = (uid) => {
    firestore
      .collection('users')
      .doc(uid)
      .get()
      .then((doc) => {
        const data = doc.data() || {};
        currentGems = Number(data.gems) || 0;
        gemBalance.textContent = currentGems.toLocaleString();
      })
      .catch(() => {
        currentGems = 0;
        gemBalance.textContent = '0';
      });
  };

  const handleOpen = () => {
    if (!currentUser) {
      showToast('Please sign in');
      return;
    }
    if (!currentMachine) {
      showToast('Machine not ready');
      return;
    }
    const price = Number(currentMachine.price) || 0;
    if (currentGems < price) {
      showToast('Not enough gems');
      return;
    }
    const rarity = pickRarity(currentMachine?.rarities || {});
    const pools = { ...defaultItems, ...(currentMachine?.items || {}) };
    const pool = normalizePool(pools[rarity])?.length ? pools[rarity] : defaultItems[rarity];
    const prize = pickItemFromPool(pool);

    showToast(`Opening…`);
    toggleOpeningOverlay(true);
    if (machineStage) {
      machineStage.classList.remove('machine-bump');
      void machineStage.offsetWidth;
      machineStage.classList.add('machine-bump');
    }
    setHitDisplay(rarity, prize);
    setTimeout(() => {
      toggleOpeningOverlay(false);
      showToast(`You won ${prize.name || 'a prize'} (${rarity})!`);
    }, 900);
  };

  const wireFairModal = () => {
    const openModal = () => fairModal.classList.remove('hidden');
    const closeModal = () => fairModal.classList.add('hidden');

    fairBtn?.addEventListener('click', openModal);
    fairClose?.addEventListener('click', closeModal);
    fairSave?.addEventListener('click', closeModal);
    fairModal?.addEventListener('click', (e) => {
      if (e.target === fairModal) closeModal();
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    loadMachine(id);
    wireFairModal();

    bumpBtn?.addEventListener('click', () => {
      runHitCycle();
    });
    openBtn?.addEventListener('click', handleOpen);

    auth.onAuthStateChanged((user) => {
      currentUser = user;
      if (user) {
        fetchGems(user.uid);
      } else {
        currentGems = 0;
        gemBalance.textContent = 'Sign in';
      }
    });
  });
})();

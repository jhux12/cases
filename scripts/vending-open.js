(() => {
  const firestore = firebase.firestore();
  const auth = firebase.auth();

  const machineName = document.getElementById('machine-name');
  const machineNamePill = document.getElementById('machine-name-pill');
  const machineDescription = document.getElementById('machine-description');
  const machinePrice = document.getElementById('machine-price');
  const openLabel = document.getElementById('open-label');
  const gemBalance = document.querySelector('#gem-balance span');
  const machineImage = document.getElementById('machine-image');
  const machineShell = document.getElementById('machine-shell');
  const openingOverlay = document.getElementById('opening-overlay');

  const hitName = document.getElementById('hit-name');
  const hitNote = document.getElementById('hit-note');
  const hitRarityPill = document.getElementById('hit-rarity-pill');
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
  let currentMachine = null;
  let unsubscribeMachine = null;
  let currentUser = null;
  let currentGems = 0;
  let hitTimer = null;

  const defaultItems = {
    common: ['Starter Bundle', 'Warm-up Pack', 'Basic Crate'],
    rare: ['Rare Neon Case', 'Holo Sticker Pack'],
    epic: ['Epic Hardware Drop', 'Mythic Blueprint'],
    legendary: ['Legendary Skin', 'Ultra Grail']
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
    if (window.VendingAnim) {
      window.VendingAnim.updateRarities(data);
    }
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
    hitName.textContent = item;
    hitNote.textContent = `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} pull · weighted preview`;
    const colorMap = {
      common: 'bg-cyan-400/20 text-cyan-100 border-cyan-400/40',
      rare: 'bg-indigo-400/20 text-indigo-100 border-indigo-400/40',
      epic: 'bg-purple-500/20 text-purple-100 border-purple-400/40',
      legendary: 'bg-amber-400/20 text-amber-100 border-amber-400/40'
    };
    hitRarityPill.textContent = rarity.charAt(0).toUpperCase() + rarity.slice(1);
    hitRarityPill.className = `px-3 py-1 rounded-full text-xs font-semibold border ${colorMap[rarity] || 'bg-white/10 text-white border-white/10'}`;
  };

  const startHitCycle = (rarities = {}, items = {}) => {
    const pools = { ...defaultItems, ...items };
    if (hitTimer) clearInterval(hitTimer);

    const cycle = () => {
      const rarity = pickRarity(rarities);
      const pool = Array.isArray(pools[rarity]) && pools[rarity].length ? pools[rarity] : defaultItems[rarity] || ['Featured hit'];
      const item = pool[Math.floor(Math.random() * pool.length)];
      setHitDisplay(rarity, item);
    };

    cycle();
    hitTimer = setInterval(cycle, 2800);
  };

  const toggleOpeningOverlay = (state) => {
    if (!openingOverlay) return;
    if (state) {
      openingOverlay.classList.remove('opacity-0', 'pointer-events-none');
      machineShell?.classList.add('ring-2', 'ring-cyan-400/50', 'shadow-[0_0_45px_rgba(34,211,238,0.35)]');
    } else {
      openingOverlay.classList.add('opacity-0', 'pointer-events-none');
      machineShell?.classList.remove('ring-2', 'ring-cyan-400/50', 'shadow-[0_0_45px_rgba(34,211,238,0.35)]');
    }
  };

  const applyMachine = (machine) => {
    currentMachine = machine;
    const rarities = machine?.rarities || {};

    machineName.textContent = machine?.name || 'Vending machine';
    machineNamePill.textContent = machine?.name || 'Vending machine';
    machineDescription.textContent = machine?.description || 'Open this machine to see the live disc stack.';
    machinePrice.textContent = formatPrice(machine?.price);
    openLabel.textContent = `Open for ${formatPrice(machine?.price)}`;

    const image = machine?.image || 'https://placehold.co/560x720/0b1224/94a3b8?text=Vending';
    machineImage.src = image;
    machineImage.alt = machine?.name || 'Vending machine';

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
    showToast('Opening…');
    toggleOpeningOverlay(true);
    if (window.VendingAnim) window.VendingAnim.bump();
    setTimeout(() => toggleOpeningOverlay(false), 1200);
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

    if (window.VendingAnim) {
      window.VendingAnim.init({ rarities: defaults });
    }

    loadMachine(id);
    wireFairModal();

    bumpBtn?.addEventListener('click', () => window.VendingAnim && window.VendingAnim.bump());
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

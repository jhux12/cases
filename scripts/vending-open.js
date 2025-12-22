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
    if (window.VendingAnim) window.VendingAnim.bump();
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

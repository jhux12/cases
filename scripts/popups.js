document.getElementById('close-popup').onclick = () => {
  document.getElementById('case-popup').classList.add('hidden');
};

document.getElementById('topup-button').onclick = () => {
  document.getElementById('topup-popup').classList.remove('hidden');
};

document.getElementById('topup-button-mobile').onclick = () => {
  document.getElementById('topup-popup').classList.remove('hidden');
};

document.getElementById('close-topup').onclick = () => {
  document.getElementById('topup-popup').classList.add('hidden');
};

function expandPrize(imageUrl) {
  const overlay = document.getElementById('prize-overlay');
  const overlayImg = document.getElementById('overlay-image');
  overlayImg.src = imageUrl;
  overlay.classList.remove('hidden');
}

function showInventoryToast(itemName) {
  const toast = document.getElementById('inventory-toast');
  const nameSpan = document.getElementById('toast-item-name');
  nameSpan.textContent = itemName;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

document.getElementById("provably-fair-badge")?.addEventListener("click", (e) => {
  e.stopPropagation();
  document.getElementById("fair-tooltip").classList.toggle("hidden");
});

window.addEventListener("click", (e) => {
  const fairTooltip = document.getElementById("fair-tooltip");
  const fairBadge = document.getElementById("provably-fair-badge");

  if (
    !fairTooltip.classList.contains("hidden") &&
    !fairTooltip.contains(e.target) &&
    !fairBadge.contains(e.target)
  ) {
    fairTooltip.classList.add("hidden");
  }
});


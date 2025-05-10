// scripts/popups.js

window.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById('case-popup');
  const topupPopup = document.getElementById('topup-popup');

  const closePopupBtn = document.getElementById('close-popup');
  const closeTopupBtn = document.getElementById('close-topup');
  const topupBtnMobile = document.getElementById('topup-button-mobile');

  if (closePopupBtn) {
    closePopupBtn.onclick = () => popup.classList.add('hidden');
  }

  if (closeTopupBtn) {
    closeTopupBtn.onclick = () => topupPopup.classList.add('hidden');
  }

  if (topupBtnMobile) {
    topupBtnMobile.onclick = () => topupPopup.classList.remove('hidden');
  }
});

// Expand image overlay
function expandPrize(imageUrl) {
  const overlay = document.getElementById('prize-overlay');
  const overlayImg = document.getElementById('overlay-image');
  overlayImg.src = imageUrl;
  overlay.classList.remove('hidden');
}

// Toast when item is added to inventory
function showInventoryToast(itemName) {
  const toast = document.getElementById('inventory-toast');
  const nameSpan = document.getElementById('toast-item-name');
  nameSpan.textContent = itemName;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

document.getElementById('close-popup').onclick = () => popup.classList.add('hidden');
closeTopup.onclick = () => topupPopup.classList.add('hidden');

document.getElementById('topup-button-mobile').onclick = () => {
  topupPopup.classList.remove('hidden');
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

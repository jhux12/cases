const popup = document.getElementById('case-popup');
const closePopup = document.getElementById('close-popup');
const topupPopup = document.getElementById('topup-popup');
const closeTopup = document.getElementById('close-topup');
const topupButtonMobile = document.getElementById('topup-button-mobile');

if (closePopup && popup) {
  closePopup.onclick = () => popup.classList.add('hidden');
}

if (closeTopup && topupPopup) {
  closeTopup.onclick = () => topupPopup.classList.add('hidden');
}

if (topupButtonMobile && topupPopup) {
  topupButtonMobile.onclick = () => topupPopup.classList.remove('hidden');
}

function expandPrize(imageUrl) {
  const overlay = document.getElementById('prize-overlay');
  const overlayImg = document.getElementById('overlay-image');
  if (overlay && overlayImg) {
    overlayImg.src = imageUrl;
    overlay.classList.remove('hidden');
  }
}

function showInventoryToast(itemName) {
  const toast = document.getElementById('inventory-toast');
  const nameSpan = document.getElementById('toast-item-name');
  if (toast && nameSpan) {
    nameSpan.textContent = itemName;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }
}

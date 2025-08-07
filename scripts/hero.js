window.addEventListener('DOMContentLoaded', () => {
  const title = document.getElementById('hero-title');
  const subtitle = document.getElementById('hero-subtitle');
  const cta = document.getElementById('hero-cta');

  if (title) setTimeout(() => title.classList.remove('opacity-0'), 200);
  if (subtitle) setTimeout(() => subtitle.classList.remove('opacity-0'), 400);
  if (cta) setTimeout(() => cta.classList.remove('opacity-0'), 600);

  const floatingContainer = document.getElementById('floating-packs');
  const casesContainer = document.getElementById('cases-container');

  function populateFloatingPacks() {
    const packImgs = casesContainer?.querySelectorAll('.case-card-img') || [];
    if (!packImgs.length || !floatingContainer) return;

    Array.from(packImgs).slice(0, 8).forEach(img => {
      const clone = document.createElement('img');
      clone.src = img.src;
      clone.alt = img.alt || 'Pack';
      clone.className = 'floating-pack';
      const top = 10 + Math.random() * 80;
      const left = 10 + Math.random() * 80;
      clone.style.top = `${top}%`;
      clone.style.left = `${left}%`;
      clone.style.animationDelay = `${Math.random() * 5}s`;
      floatingContainer.appendChild(clone);
    });
  }

  if (casesContainer) {
    const observer = new MutationObserver((mutations, obs) => {
      if (casesContainer.querySelector('.case-card-img')) {
        obs.disconnect();
        populateFloatingPacks();
      }
    });
    observer.observe(casesContainer, { childList: true, subtree: true });
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('h1.animate-fade-up');
  const paragraph = document.querySelector('p.animate-fade-up');
  const cta = document.querySelector('#hero a.animate-fade-up');
  const packWrapper = document.getElementById('hero-pack-wrapper');

  if (title) setTimeout(() => title.classList.remove('opacity-0'), 200);
  if (paragraph) setTimeout(() => paragraph.classList.remove('opacity-0'), 400);
  if (cta) setTimeout(() => cta.classList.remove('opacity-0'), 600);
  if (packWrapper) setTimeout(() => packWrapper.classList.remove('opacity-0'), 800);

  const carousel = document.getElementById('hero-pack-carousel');
  const casesContainer = document.getElementById('cases-container');

  function buildCarousel() {
    const packImgs = casesContainer?.querySelectorAll('.case-card-img') || [];
    if (!packImgs.length || !carousel) return;

    Array.from(packImgs).slice(0, 5).forEach((img, i) => {
      const clone = document.createElement('img');
      clone.src = img.src;
      clone.alt = img.alt || 'Pack';
      clone.className = 'hero-pack-img';
      if (i === 0) clone.classList.add('active');
      carousel.appendChild(clone);
    });

    startCarousel();
  }

  function startCarousel() {
    const slides = carousel?.querySelectorAll('img') || [];
    if (slides.length <= 1) return;

    let index = 0;
    setInterval(() => {
      slides[index].classList.remove('active');
      index = (index + 1) % slides.length;
      slides[index].classList.add('active');
    }, 3000);
  }

  if (casesContainer) {
    const observer = new MutationObserver((mutations, obs) => {
      if (casesContainer.querySelector('.case-card-img')) {
        obs.disconnect();
        buildCarousel();
      }
    });
    observer.observe(casesContainer, { childList: true, subtree: true });
  }
});


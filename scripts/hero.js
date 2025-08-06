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
  let carouselBuilt = false;

  function buildCarousel(packImgs = []) {
    if (!carousel || carouselBuilt) return;

    if (!packImgs.length) {
      packImgs = Array.from(
        casesContainer?.querySelectorAll('.case-card-img') || []
      ).map(img => ({ src: img.src, alt: img.alt || 'Pack' }));

      if (!packImgs.length) {
        const defaults = [
          'https://images.unsplash.com/photo-1606813902481-2b8128237c4a?auto=format&fit=crop&w=480&q=80',
          'https://images.unsplash.com/photo-1611605697880-0b4b80ca7541?auto=format&fit=crop&w=480&q=80',
          'https://images.unsplash.com/photo-1526312426976-f4d754fa9bd6?auto=format&fit=crop&w=480&q=80'
        ];
        packImgs = defaults.map(src => ({ src, alt: 'Pack' }));
      }
    }

    packImgs.slice(0, 5).forEach((img, i) => {
      const clone = document.createElement('img');
      clone.src = img.src;
      clone.alt = img.alt || 'Pack';
      clone.className = 'hero-pack-img';
      if (i === 0) clone.classList.add('active');
      carousel.appendChild(clone);
    });

    carouselBuilt = true;
    startCarousel();
  }

  function fireConfetti() {
    if (typeof confetti === 'function') {
      confetti({ particleCount: 25, spread: 60, origin: { y: 0.2 } });
    }
  }

  function startCarousel() {
    const slides = carousel?.querySelectorAll('img') || [];
    if (slides.length <= 1) return;

    let index = 0;
    fireConfetti();
    setInterval(() => {
      slides[index].classList.remove('active');
      index = (index + 1) % slides.length;
      slides[index].classList.add('active');
      fireConfetti();
    }, 3000);
  }

  document.addEventListener('casesLoaded', e => {
    const cases = (e.detail || []).map(c => ({ src: c.image, alt: c.name }));
    buildCarousel(cases);
  });

  if (casesContainer) {
    const observer = new MutationObserver((mutations, obs) => {
      if (casesContainer.querySelector('.case-card-img')) {
        obs.disconnect();
        buildCarousel();
      }
    });
    observer.observe(casesContainer, { childList: true, subtree: true });
    setTimeout(() => {
      if (!carousel?.children.length) buildCarousel();
    }, 5000);
  } else {
    buildCarousel();
  }
});


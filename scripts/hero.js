window.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('h1.animate-fade-up');
  const paragraph = document.querySelector('p.animate-fade-up');

  if (title) {
    setTimeout(() => {
      title.classList.remove('opacity-0');
    }, 200);
  }

  if (paragraph) {
    setTimeout(() => {
      paragraph.classList.remove('opacity-0');
    }, 600);
  }

  const carousel = document.getElementById('hero-pack-carousel');
  const casesContainer = document.getElementById('cases-container');

  function buildCarousel() {
    const packImgs = casesContainer?.querySelectorAll('.case-card-img') || [];
    if (!packImgs.length || !carousel) return;

    Array.from(packImgs).slice(0, 5).forEach(img => {
      const clone = document.createElement('img');
      clone.src = img.src;
      clone.alt = img.alt || 'Pack';
      clone.className = 'w-40 md:w-56 h-auto object-contain flex-shrink-0 rounded-lg shadow-lg transition-transform duration-300';
      carousel.appendChild(clone);
    });

    startCarousel();
  }

  function startCarousel() {
    if (!carousel || carousel.children.length <= 1) return;

    let index = 0;
    const slides = Array.from(carousel.children);
    slides[0].classList.add('scale-105');

    setInterval(() => {
      const width = slides[0].clientWidth;
      index = (index + 1) % slides.length;
      carousel.style.transform = `translateX(-${index * width}px)`;
      slides.forEach((img, i) => img.classList.toggle('scale-105', i === index));
    }, 2500);
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


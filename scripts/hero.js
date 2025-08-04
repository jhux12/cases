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
  if (carousel && carousel.children.length > 1) {
    let index = 0;
    setInterval(() => {
      const width = carousel.children[0].clientWidth;
      index = (index + 1) % carousel.children.length;
      carousel.style.transform = `translateX(-${index * width}px)`;
    }, 2500);
  }
});


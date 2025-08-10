window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.hero-fade').forEach((el, i) => {
    setTimeout(() => {
      el.classList.remove('opacity-0', 'translate-y-4');
    }, i * 200);
  });

  // Parallax hero layers
  const hero = document.getElementById('hero');
  const layers = hero ? hero.querySelectorAll('.parallax-layer') : [];
  hero?.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    layers.forEach(layer => {
      const depth = parseFloat(layer.dataset.depth || '0');
      const moveX = -x * 30 * depth;
      const moveY = -y * 30 * depth;
      layer.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.15)`;
    });
  });

  // Reveal highlight cards on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('opacity-0', 'translate-y-8');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.highlight-card, .trending-card').forEach(card => observer.observe(card));
});

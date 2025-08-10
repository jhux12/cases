window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.hero-fade').forEach((el, i) => {
    setTimeout(() => {
      el.classList.remove('opacity-0', 'translate-y-4');
    }, i * 200);
  });
});

window.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('h1.animate-fade-up');
  const paragraph = document.querySelector('p.animate-fade-up');
  const cta = document.querySelector('#hero a.animate-fade-up');

  if (title) setTimeout(() => title.classList.remove('opacity-0'), 200);
  if (paragraph) setTimeout(() => paragraph.classList.remove('opacity-0'), 400);
  if (cta) setTimeout(() => cta.classList.remove('opacity-0'), 600);
});

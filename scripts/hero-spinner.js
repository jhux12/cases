document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('spinner-track');
  const spinner = document.getElementById('card-spinner');
  if (!track || !spinner) return;

  const gradients = [
    'linear-gradient(135deg,#6C5CE7,#09F)',
    'linear-gradient(135deg,#09F,#FF4DD8)',
    'linear-gradient(135deg,#FF4DD8,#6C5CE7)',
    'linear-gradient(135deg,#6C5CE7,#FF4DD8)',
    'linear-gradient(135deg,#09F,#6C5CE7)',
    'linear-gradient(135deg,#FF4DD8,#09F)',
    'linear-gradient(135deg,#1a1a4f,#6C5CE7)',
    'linear-gradient(135deg,#0a0f2c,#09F)',
    'linear-gradient(135deg,#1b0f3c,#FF4DD8)',
    'linear-gradient(135deg,#6C5CE7,#1b0f3c)'
  ];

  gradients.forEach(g => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.setProperty('--bg', g);
    track.appendChild(card);
  });

  const cards = Array.from(track.children);
  let index = -1;

  function spin() {
    index = (index + 1) % cards.length;
    const cardWidth = cards[0].offsetWidth + 16;
    const offset = cardWidth * index;
    const containerWidth = spinner.offsetWidth;
    const centerShift = containerWidth / 2 - cardWidth / 2;
    track.style.transform = `translateX(${centerShift - offset}px)`;

    cards.forEach(c => c.classList.remove('prev','next','center'));
    const center = index;
    const prev = (center - 1 + cards.length) % cards.length;
    const next = (center + 1) % cards.length;
    cards[center].classList.add('center');
    cards[prev].classList.add('prev');
    cards[next].classList.add('next');
  }

  spin();
  setInterval(spin, 5000);

  const particleContainer = document.getElementById('hero-particles');
  if (particleContainer) {
    const colors = ['#6C5CE7','#09F','#FF4DD8'];
    for (let i=0; i<30; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.style.top = Math.random()*100 + '%';
      p.style.left = Math.random()*100 + '%';
      p.style.animationDelay = (Math.random()*8) + 's';
      const c = colors[Math.floor(Math.random()*colors.length)];
      p.style.backgroundColor = c;
      p.style.boxShadow = `0 0 6px ${c}`;
      particleContainer.appendChild(p);
    }
  }
});

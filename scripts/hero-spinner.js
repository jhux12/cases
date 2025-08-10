document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('spinner-track');
  const spinner = document.getElementById('card-spinner');
  if (!track || !spinner) return;

  const cardData = [
    { img: 'https://placehold.co/160x220/1e1e1e/ffffff?text=Common+1', rarity: 'common' },
    { img: 'https://placehold.co/160x220/1e1e1e/ffffff?text=Common+2', rarity: 'common' },
    { img: 'https://placehold.co/160x220/1e1e1e/ffffff?text=Common+3', rarity: 'common' },
    { img: 'https://placehold.co/160x220/1e1e1e/ffffff?text=Common+4', rarity: 'common' },
    { img: 'https://placehold.co/160x220/1e1e1e/ffffff?text=Common+5', rarity: 'common' },
    { img: 'https://placehold.co/160x220/1e1e1e/ffffff?text=Common+6', rarity: 'common' },
    { img: 'https://placehold.co/160x220/ffe066/000000?text=RARE',     rarity: 'rare' }
  ];

  cardData.forEach(data => {
    const card = document.createElement('div');
    card.className = 'card' + (data.rarity === 'rare' ? ' rare' : '');
    card.style.backgroundImage = `url(${data.img})`;
    card.style.backgroundSize = 'cover';
    card.style.backgroundPosition = 'center';
    track.appendChild(card);
  });

  const cards = Array.from(track.children);
  const rareIndex = cardData.findIndex(c => c.rarity === 'rare');
  const cardWidth = cards[0].offsetWidth + 16;
  const containerWidth = spinner.offsetWidth;
  const centerShift = containerWidth / 2 - cardWidth / 2;

  function showIndex(i, duration = 0.3) {
    track.style.transition = `transform ${duration}s cubic-bezier(0.25, 0.8, 0.25, 1)`;
    track.style.transform = `translateX(${centerShift - cardWidth * i}px)`;

    cards.forEach(c => c.classList.remove('prev','next','center'));
    const prev = (i - 1 + cards.length) % cards.length;
    const next = (i + 1) % cards.length;
    cards[i].classList.add('center');
    cards[prev].classList.add('prev');
    cards[next].classList.add('next');
  }

  function demoSpin() {
    const sequence = [];
    const commonCount = cards.length - 1;
    for (let i = 0; i < 5; i++) {
      sequence.push(Math.floor(Math.random() * commonCount));
    }
    sequence.push(rareIndex);

    let step = 0;
    function run() {
      const isLast = step === sequence.length - 1;
      showIndex(sequence[step], isLast ? 1.1 : 0.25);
      step++;
      if (step < sequence.length) {
        setTimeout(run, isLast ? 1200 : 250);
      } else {
        setTimeout(demoSpin, 3000);
      }
    }
    run();
  }

  demoSpin();

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

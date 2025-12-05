(() => {
  const style = document.createElement('style');
  style.textContent = `
    #preloader {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      --preloader-bg: #f8fafc;
      --preloader-text: #1f2937;
      --preloader-progress: linear-gradient(90deg, #3b82f6, #8b5cf6);
      background-color: var(--preloader-bg);
      color: var(--preloader-text);
      font-family: 'Poppins', sans-serif;
      z-index: 9999;
      transition: opacity 0.5s ease;
    }
    #preloader[data-theme='dark'] {
      --preloader-bg: #0b0f1c;
      --preloader-text: #e5e7eb;
      --preloader-progress: linear-gradient(90deg, #60a5fa, #a78bfa);
    }
    #preloader.fade-out {
      opacity: 0;
    }
    #preloader img {
      width: 10rem;
      height: 10rem;
      margin-bottom: 1.5rem;
      animation: bounce 1s infinite;
    }
    #preloader-progress {
      font-size: 1.5rem;
      font-weight: 700;
      background: var(--preloader-progress);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    @keyframes bounce {
      0%, 100% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0.8,0,1,1);
      }
      50% {
        transform: translateY(0);
        animation-timing-function: cubic-bezier(0,0,0.2,1);
      }
    }
  `;
  document.head.appendChild(style);

  const getPreferredTheme = () => {
    const stored = localStorage.getItem('packly-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const preloader = document.createElement('div');
  preloader.id = 'preloader';
  preloader.innerHTML = `
    <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/ChatGPT%20Image%20Aug%2010%2C%202025%2C%2011_08_17%20PM.png?alt=media&token=4950e6a0-1cf9-4c7b-aa56-686dc42693a8" alt="Mascot">
    <div id="preloader-progress">0%</div>
  `;
  document.body.appendChild(preloader);

  const applyTheme = (theme) => {
    preloader.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  };

  applyTheme(getPreferredTheme());

  const observer = new MutationObserver(() => {
    if (!document.body) return;
    applyTheme(document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  });

  if (document.body) {
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  let current = 0;
  const progressEl = document.getElementById('preloader-progress');
  const interval = setInterval(() => {
    current = Math.min(current + Math.random() * 10, 90);
    progressEl.textContent = `${Math.floor(current)}%`;
  }, 100);

  window.addEventListener('load', () => {
    clearInterval(interval);
    progressEl.textContent = '100%';
    preloader.classList.add('fade-out');
    setTimeout(() => {
      observer.disconnect();
      preloader.remove();
    }, 500);
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;

  if (!document.querySelector('link[href="styles/main.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/main.css';
    document.head.appendChild(link);
  }

  if (!document.querySelector('link[href*="font-awesome"]')) {
    const fa = document.createElement('link');
    fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(fa);
  }

  header.innerHTML = `
    <nav class="navbar fixed top-0 left-0 right-0 z-50 border-b border-gray-200 backdrop-blur bg-white/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <a href="index.html" class="flex-shrink-0 flex items-center">
              <span class="text-2xl font-bold gradient-text logo-animate">pullz.gg</span>
            </a>
            <div class="hidden md:ml-6 md:flex md:space-x-8">
              <a data-nav="index.html" href="index.html" class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"><i class="fas fa-box-open mr-1"></i>Open Packs</a>
              <a data-nav="marketplace.html" href="marketplace.html" class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"><i class="fas fa-store mr-1"></i>Marketplace</a>
              <a data-nav="rewards.html" href="rewards.html" class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"><i class="fas fa-gift mr-1"></i>Rewards</a>
            </div>
          </div>
          <div class="hidden md:ml-6 md:flex md:items-center md:space-x-6">
            <button id="theme-toggle-desktop-standalone" class="theme-toggle" type="button" aria-label="Toggle dark mode">
              <i class="fas fa-moon"></i>
            </button>
            <div id="auth-buttons" class="flex items-center space-x-4">
              <a id="signin-desktop" href="auth.html" class="text-sm font-medium text-gray-700 hover:text-gray-900">Sign In</a>
              <a id="register-desktop" href="auth.html#register" class="text-sm font-medium text-indigo-600 hover:text-indigo-800">Register</a>
            </div>
            <div id="user-area" class="hidden md:hidden md:items-center md:space-x-4">
              <div id="user-toolbar-desktop" class="user-toolbar hidden">
                <div id="user-balance" class="hidden balance-chip items-center gap-2 px-2.5 py-1 text-white">
                  <div class="balance-icon flex items-center justify-center w-7 h-7 rounded-full">
                    <svg class="w-4 h-4 gem-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path fill="url(#gemGradientBalanceDesktop)" d="M12 3l4.5 2h3L18 9l-6 12L6 9 4.5 5h3z" />
                      <path fill="#7dd3fc" d="M12 3l6 6h-3z" />
                      <path fill="#22d3ee" d="M6 9l6-6-2.5 6z" />
                      <path fill="#a5b4fc" d="M12 21l2.5-12 3.5 0z" />
                      <path fill="#bae6fd" d="M12 21L9.5 9H6z" />
                      <defs>
                        <linearGradient id="gemGradientBalanceDesktop" x1="5" x2="19" y1="5" y2="19" gradientUnits="userSpaceOnUse">
                          <stop stop-color="#5eead4" />
                          <stop offset="1" stop-color="#60a5fa" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div class="flex flex-col leading-tight">
                    <span id="balance-amount" class="balance-amount text-sm">0</span>
                    <span class="balance-label">gems</span>
                  </div>
                  <button id="topup-button" class="topup-chip ml-2 hidden">+</button>
                </div>
                <button id="theme-toggle-desktop-chip" class="theme-toggle chip-toggle hidden" type="button" aria-label="Toggle dark mode">
                  <i class="fas fa-moon"></i>
                </button>
                <button id="notification-bell" class="notification-button hidden relative" aria-label="Notifications">
                  <span id="notification-indicator" class="notification-indicator hidden"></span>
                  <i class="fas fa-bell"></i>
                </button>
              </div>
              <div class="ml-2 relative flex-shrink-0">
                <button id="dropdown-toggle" class="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none">
                  <span id="username-display">User</span>
                  <svg class="w-5 h-5 ml-2 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div class="py-1">
                    <a href="inventory.html" class="user-nav-link block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Inventory</a>
                    <a href="profile.html" class="user-nav-link block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
                    <a href="how-it-works.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">How It Works</a>
                    <a id="logout-desktop" href="#" class="hidden block px-4 py-2 text-sm text-red-500 hover:bg-gray-100">Logout</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="-mr-2 flex items-center md:hidden">
            <div id="user-toolbar-mobile" class="user-toolbar mr-3">
              <div id="user-balance-mobile-header" class="hidden balance-chip items-center gap-2 px-2.5 py-1 text-white">
                <div class="balance-icon flex items-center justify-center w-7 h-7 rounded-full">
                  <svg class="w-4 h-4 gem-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path fill="url(#gemGradientBalanceMobile)" d="M12 3l4.5 2h3L18 9l-6 12L6 9 4.5 5h3z" />
                    <path fill="#7dd3fc" d="M12 3l6 6h-3z" />
                    <path fill="#22d3ee" d="M6 9l6-6-2.5 6z" />
                    <path fill="#a5b4fc" d="M12 21l2.5-12 3.5 0z" />
                    <path fill="#bae6fd" d="M12 21L9.5 9H6z" />
                    <defs>
                      <linearGradient id="gemGradientBalanceMobile" x1="5" x2="19" y1="5" y2="19" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#5eead4" />
                        <stop offset="1" stop-color="#60a5fa" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div class="flex flex-col leading-tight">
                  <span id="balance-amount-mobile" class="balance-amount text-sm">0</span>
                  <span class="balance-label">gems</span>
                </div>
                <button id="topup-button-mobile-header" class="topup-chip hidden">+</button>
              </div>
              <button id="notification-bell-mobile" class="notification-button hidden relative" aria-label="Notifications">
                <span id="notification-indicator-mobile" class="notification-indicator hidden"></span>
                <i class="fas fa-bell"></i>
              </button>
              <button id="menu-toggle" type="button" class="menu-toggle-button" aria-expanded="false" aria-label="Open main menu">
                <i class="fas fa-bars"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div id="mobile-dropdown" class="md:hidden hidden">
        <div class="pt-2 pb-3 space-y-1">
          <a data-nav="index.html" href="index.html" class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"><i class="fas fa-box-open mr-2"></i>Open Packs</a>
          <a data-nav="marketplace.html" href="marketplace.html" class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"><i class="fas fa-store mr-2"></i>Marketplace</a>
          <a data-nav="rewards.html" href="rewards.html" class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"><i class="fas fa-gift mr-2"></i>Rewards</a>
        </div>
        <div class="pt-4 pb-3 border-t border-gray-200">
          <div class="px-4 mb-3">
            <button id="theme-toggle-mobile-menu" class="theme-toggle menu-entry w-full" type="button" aria-label="Toggle dark mode">
              <div class="flex items-center gap-3">
                <span class="menu-entry-icon">
                  <i class="fas fa-moon"></i>
                </span>
                <div class="text-left leading-tight">
                  <div class="text-sm font-semibold text-gray-800 dark:text-slate-100">Theme</div>
                  <div class="text-xs text-gray-500 dark:text-slate-300">Light / Dark</div>
                </div>
              </div>
              <span class="theme-state-label text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-100">Light</span>
            </button>
          </div>
          <div class="space-y-1">
            <a id="mobile-inventory-link" href="inventory.html" class="hidden block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100">Inventory</a>
            <a id="mobile-profile-link" href="profile.html" class="hidden block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100">Profile</a>
            <a href="how-it-works.html" class="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100">How It Works</a>
            <a id="mobile-auth-button" href="auth.html" class="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100">Sign In</a>
            <a id="mobile-register-button" href="auth.html#register" class="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100">Register</a>
          </div>
        </div>
      </div>
    </nav>
    <div id="notification-center" class="notification-center hidden" role="dialog" aria-label="Notifications">
      <div class="notification-center__header">
        <div>
          <p class="notification-center__eyebrow">Sitewide updates</p>
          <p class="notification-center__title">Notifications</p>
        </div>
      </div>
      <div id="notification-list" class="notification-list">
        <p class="notification-empty">No notifications yet.</p>
      </div>
    </div>
  `;

  const enhanceLogoAnimation = () => {
    document.querySelectorAll('.logo-animate').forEach((logo) => {
      if (logo.dataset.slotReady === 'true') return;

      const text = logo.textContent.trim();
      if (!text) return;

      const letters = text.split('');
      const fragment = document.createDocumentFragment();

      letters.forEach((letter, index) => {
        const span = document.createElement('span');
        span.className = 'logo-letter';
        span.dataset.letter = letter;
        span.style.setProperty('--logo-letter-index', index);
        span.textContent = letter;
        fragment.appendChild(span);
      });

      logo.setAttribute('aria-label', text);
      logo.textContent = '';
      logo.appendChild(fragment);
      logo.dataset.slotReady = 'true';
    });
  };

  enhanceLogoAnimation();

  const current = window.location.pathname.split('/').pop() || 'index.html';
  header.querySelectorAll('a[data-nav]').forEach(link => {
    if (link.getAttribute('data-nav') === current) {
      if (link.closest('#mobile-dropdown')) {
        link.classList.add('border-indigo-500', 'text-indigo-700', 'bg-indigo-50');
        link.classList.remove('border-transparent', 'text-gray-600', 'hover:bg-gray-50', 'hover:border-gray-300');
      } else {
        link.classList.add('border-indigo-500', 'text-gray-900');
        link.classList.remove('border-transparent', 'text-gray-500', 'hover:border-gray-300', 'hover:text-gray-700');
      }
    }
  });

  const themeButtons = header.querySelectorAll('.theme-toggle');
  const themeStateLabels = header.querySelectorAll('.theme-state-label');
  const storedTheme = localStorage.getItem('pullz-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  const ensureThemeMeta = () => {
    const ensureSpecificMeta = (selector, attributes) => {
      let meta = document.querySelector(selector);

      if (!meta) {
        meta = document.createElement('meta');
        Object.assign(meta, { name: 'theme-color' });
        Object.entries(attributes).forEach(([key, value]) => meta.setAttribute(key, value));
        document.head.appendChild(meta);
      }

      return meta;
    };

    const lightMeta = ensureSpecificMeta('meta[name="theme-color"][data-theme="light"]', {
      'data-theme': 'light',
      media: '(prefers-color-scheme: light)',
    });

    const darkMeta = ensureSpecificMeta('meta[name="theme-color"][data-theme="dark"]', {
      'data-theme': 'dark',
      media: '(prefers-color-scheme: dark)',
    });

    const dynamicMeta = ensureSpecificMeta('meta[name="theme-color"][data-dynamic="true"]', {
      'data-dynamic': 'true',
    });

    return { lightMeta, darkMeta, dynamicMeta };
  };

  const setThemeColor = (isDark) => {
    const { lightMeta, darkMeta, dynamicMeta } = ensureThemeMeta();
    const lightColor = '#f8fafc';
    const darkColor = '#0b0f1c';

    lightMeta.setAttribute('content', lightColor);
    darkMeta.setAttribute('content', darkColor);

    dynamicMeta.setAttribute('content', isDark ? darkColor : lightColor);
    document.documentElement.style.setProperty('color-scheme', isDark ? 'dark' : 'light');
  };

  const applyTheme = (mode) => {
    const isDark = mode === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    document.documentElement.classList.toggle('dark-mode', isDark);
    localStorage.setItem('pullz-theme', isDark ? 'dark' : 'light');

    setThemeColor(isDark);

    themeButtons.forEach((btn) => {
      const icon = btn.querySelector('i');
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      if (icon) {
        icon.classList.toggle('fa-moon', !isDark);
        icon.classList.toggle('fa-sun', isDark);
      }
    });

    themeStateLabels.forEach((label) => {
      label.textContent = isDark ? 'Dark' : 'Light';
    });
  };

  const initialTheme = storedTheme || (prefersDark.matches ? 'dark' : 'light');
  applyTheme(initialTheme);

  prefersDark.addEventListener('change', (event) => {
    if (!localStorage.getItem('pullz-theme')) {
      applyTheme(event.matches ? 'dark' : 'light');
    }
  });

  const syncThemeMeta = () => {
    setThemeColor(document.body.classList.contains('dark-mode'));
  };

  const bodyObserver = new MutationObserver(syncThemeMeta);
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  themeButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(nextTheme);
    })
  );
});

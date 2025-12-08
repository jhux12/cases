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
    <div id="notification-drawer" class="notification-drawer hidden">
      <div class="notification-drawer-header">
        <div class="flex items-center gap-2">
          <span class="notification-dot" aria-hidden="true"></span>
          <p class="text-sm font-semibold">Notifications</p>
        </div>
        <button id="notification-close" type="button" class="notification-dismiss" aria-label="Close notifications">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div id="notification-items" class="notification-items hidden"></div>
      <p id="notification-empty" class="notification-empty">No notifications right now.</p>
    </div>
    <nav class="navbar fixed top-0 left-0 right-0 z-40 border-b border-gray-200 backdrop-blur bg-white/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <a href="index.html" class="flex-shrink-0 flex items-center">
              <span class="text-2xl font-bold gradient-text">packly.gg</span>
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
                    <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/diamond.png?alt=media&token=244f4b80-1832-4c7c-89da-747a1f8457ff" class="w-4 h-4 object-contain" alt="Gems" />
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
                <button id="notification-bell" class="notification-button hidden" aria-label="Notifications">
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
                  <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/diamond.png?alt=media&token=244f4b80-1832-4c7c-89da-747a1f8457ff" class="w-4 h-4 object-contain" alt="Gems" />
                </div>
                <div class="flex flex-col leading-tight">
                  <span id="balance-amount-mobile" class="balance-amount text-sm">0</span>
                  <span class="balance-label">gems</span>
                </div>
                <button id="topup-button-mobile-header" class="topup-chip hidden">+</button>
              </div>
              <button id="notification-bell-mobile" class="notification-button hidden" aria-label="Notifications">
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
          <div id="user-balance-mobile-drawer" class="hidden balance-chip items-center justify-between px-3.5 py-1.5 text-sm text-white mx-4 mb-3">
            <div class="flex items-center gap-3">
              <div class="balance-icon flex items-center justify-center w-7 h-7 rounded-full">
                <img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/diamond.png?alt=media&token=244f4b80-1832-4c7c-89da-747a1f8457ff" class="w-4 h-4 object-contain" alt="Gems" />
              </div>
              <div class="flex flex-col leading-tight">
                <span id="balance-amount-mobile-dropdown" class="balance-amount text-xs">0</span>
                <span class="balance-label">gems</span>
              </div>
            </div>
            <button id="topup-button-mobile-drawer" class="topup-chip hidden">+</button>
          </div>
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
  `;

  const notificationDrawer = document.getElementById("notification-drawer");
  const notificationItems = document.getElementById("notification-items");
  const notificationEmpty = document.getElementById("notification-empty");
  const notificationClose = document.getElementById("notification-close");

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
  const storedTheme = localStorage.getItem('packly-theme');
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

  const noticeStyles = {
    info: {
      label: 'Info',
      icon: 'fa-circle-info',
      bar: 'bg-indigo-50/90 border-indigo-200 text-indigo-900',
      pill: 'bg-indigo-100 text-indigo-900',
      cta: 'text-indigo-800'
    },
    success: {
      label: 'Success',
      icon: 'fa-circle-check',
      bar: 'bg-emerald-50/90 border-emerald-200 text-emerald-900',
      pill: 'bg-emerald-100 text-emerald-900',
      cta: 'text-emerald-800'
    },
    warning: {
      label: 'Warning',
      icon: 'fa-triangle-exclamation',
      bar: 'bg-amber-50/90 border-amber-200 text-amber-900',
      pill: 'bg-amber-100 text-amber-900',
      cta: 'text-amber-800'
    },
    danger: {
      label: 'Alert',
      icon: 'fa-circle-exclamation',
      bar: 'bg-rose-50/90 border-rose-200 text-rose-900',
      pill: 'bg-rose-100 text-rose-900',
      cta: 'text-rose-800'
    }
  };

  let siteNoticeState = null;
  const noticeDismissKey = 'site-notice-dismissed-at';

  const isNoticeDismissed = (notice) => {
    if (!notice?.createdAt) return false;
    const dismissedAt = Number(localStorage.getItem(noticeDismissKey) || 0);
    return dismissedAt >= Number(notice.createdAt);
  };

  const setBellUnread = (hasUnread) => {
    [notificationBell, notificationBellMobile].forEach((btn) => {
      if (!btn) return;
      btn.classList.toggle('has-unread', !!hasUnread);
      btn.setAttribute('aria-label', hasUnread ? 'Notifications (new)' : 'Notifications');
    });
  };

  const renderNotificationDrawer = (notice) => {
    siteNoticeState = notice;
    const shouldShowNotice = notice && notice.active && notice.message && !isNoticeDismissed(notice);
    setBellUnread(shouldShowNotice);

    if (!notificationDrawer || !notificationItems || !notificationEmpty) return;

    notificationItems.innerHTML = '';
    notificationItems.classList.toggle('hidden', !shouldShowNotice);
    notificationEmpty.classList.toggle('hidden', shouldShowNotice);

    if (!shouldShowNotice) return;

    const style = noticeStyles[notice.style] || noticeStyles.info;
    const item = document.createElement('div');
    item.className = 'notification-item';
    item.innerHTML = `
      <div class="notification-item-header">
        <span class="notification-pill ${style.pill}"><i class="fas ${style.icon}"></i> ${style.label}</span>
        <button class="notification-dismiss" type="button" aria-label="Dismiss notification">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <p class="notification-message">${notice.message}</p>
      ${notice.ctaText && notice.ctaUrl ? `<a class="notification-cta ${style.cta}" href="${notice.ctaUrl}" target="_blank" rel="noopener">${notice.ctaText}</a>` : ''}
    `;

    const dismissBtn = item.querySelector('.notification-dismiss');
    dismissBtn?.addEventListener('click', () => {
      if (notice.createdAt) {
        localStorage.setItem(noticeDismissKey, String(notice.createdAt));
      }
      setBellUnread(false);
      notificationItems.classList.add('hidden');
      notificationEmpty.classList.remove('hidden');
      siteNoticeState = { ...notice, active: false };
    });

    const ctaLink = item.querySelector('.notification-cta');
    ctaLink?.addEventListener('click', () => {
      notificationDrawer.classList.add('hidden');
    });

    notificationItems.appendChild(item);
  };

  const toggleNotificationDrawer = () => {
    if (!notificationDrawer) return;
    const isHidden = notificationDrawer.classList.contains('hidden');
    if (isHidden) {
      renderNotificationDrawer(siteNoticeState);
      notificationDrawer.classList.remove('hidden');
    } else {
      notificationDrawer.classList.add('hidden');
    }
  };

  notificationClose?.addEventListener('click', () => {
    notificationDrawer?.classList.add('hidden');
  });

  const initSiteNotice = () => {
    if (!window.firebase?.database) return;
    firebase.database().ref('siteNotification').on('value', (snap) => {
      renderNotificationDrawer(snap.val());
    });
  };

  [notificationBell, notificationBellMobile].forEach((btn) =>
    btn?.addEventListener('click', (event) => {
      event.preventDefault();
      toggleNotificationDrawer();
    })
  );

  document.addEventListener('click', (event) => {
    if (!notificationDrawer || notificationDrawer.classList.contains('hidden')) return;
    const target = event.target;
    const isBell = [notificationBell, notificationBellMobile].some((btn) => btn && btn.contains(target));
    if (!notificationDrawer.contains(target) && !isBell) {
      notificationDrawer.classList.add('hidden');
    }
  });

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
    localStorage.setItem('packly-theme', isDark ? 'dark' : 'light');

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
  initSiteNotice();
  applyTheme(initialTheme);

  prefersDark.addEventListener('change', (event) => {
    if (!localStorage.getItem('packly-theme')) {
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

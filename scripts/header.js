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
    <div id="site-notice-container" class="hidden fixed top-16 inset-x-0 z-50 px-4">
      <div id="site-notice-bar" class="rounded-xl border px-4 py-3 shadow-lg">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <p id="site-notice-message" class="font-semibold text-sm"></p>
            <a id="site-notice-cta" href="#" target="_blank" rel="noopener" class="hidden text-xs font-semibold underline decoration-2 underline-offset-4">Learn more</a>
          </div>
          <div class="flex items-center gap-3">
            <span id="site-notice-pill" class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"></span>
            <button id="site-notice-close" type="button" class="rounded-full p-2 hover:bg-black/10 focus:outline-none" aria-label="Dismiss notification">
              <i class="fas fa-xmark"></i>
            </button>
          </div>
        </div>
      </div>
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
                <div class="relative">
                  <button id="notification-bell" class="notification-button hidden" aria-label="Notifications">
                    <i class="fas fa-bell"></i>
                    <span id="notification-badge" class="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 hidden"></span>
                  </button>
                  <div id="notification-menu" class="hidden absolute right-0 mt-3 w-80 rounded-xl border border-gray-200/80 bg-white text-gray-900 shadow-lg ring-1 ring-black/5 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100">
                    <div class="p-3 border-b border-gray-100/80 dark:border-slate-800">
                      <div class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-slate-100">
                        <i class="fas fa-bell text-indigo-500"></i>
                        Notifications
                      </div>
                      <p class="mt-1 text-xs text-gray-600 dark:text-slate-300">Stay up to date with the latest announcements.</p>
                    </div>
                    <div id="notification-list" class="max-h-80 overflow-y-auto p-3 space-y-3 text-sm text-gray-800 dark:text-slate-100">
                      <div class="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">No notifications yet.</div>
                    </div>
                  </div>
                </div>
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
              <div class="relative">
                <button id="notification-bell-mobile" class="notification-button hidden" aria-label="Notifications">
                  <i class="fas fa-bell"></i>
                  <span id="notification-badge-mobile" class="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 hidden"></span>
                </button>
                <div id="notification-menu-mobile" class="hidden absolute right-0 mt-3 w-[18rem] rounded-xl border border-gray-200/80 bg-white text-gray-900 shadow-lg ring-1 ring-black/5 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-100">
                  <div class="p-3 border-b border-gray-100/80 dark:border-slate-800">
                    <div class="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-slate-100">
                      <i class="fas fa-bell text-indigo-500"></i>
                      Notifications
                    </div>
                    <p class="mt-1 text-xs text-gray-600 dark:text-slate-300">Stay up to date with the latest announcements.</p>
                  </div>
                  <div id="notification-list-mobile" class="max-h-80 overflow-y-auto p-3 space-y-3 text-sm text-gray-800 dark:text-slate-100">
                    <div class="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">No notifications yet.</div>
                  </div>
                </div>
              </div>
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

  const siteNoticeContainer = document.getElementById("site-notice-container");
  const siteNoticeBar = document.getElementById("site-notice-bar");
  const siteNoticeMessage = document.getElementById("site-notice-message");
  const siteNoticeCta = document.getElementById("site-notice-cta");
  const siteNoticePill = document.getElementById("site-notice-pill");
  const siteNoticeClose = document.getElementById("site-notice-close");
  const notificationBadge = document.getElementById("notification-badge");
  const notificationBadgeMobile = document.getElementById("notification-badge-mobile");
  const notificationMenu = document.getElementById("notification-menu");
  const notificationMenuMobile = document.getElementById("notification-menu-mobile");
  const notificationList = document.getElementById("notification-list");
  const notificationListMobile = document.getElementById("notification-list-mobile");
  const notificationBell = document.getElementById("notification-bell");
  const notificationBellMobile = document.getElementById("notification-bell-mobile");

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

  const closeNotificationMenus = () => {
    [notificationMenu, notificationMenuMobile].forEach((menu) => menu?.classList.add('hidden'));
  };

  const toggleNotificationMenu = (menu) => {
    if (!menu) return;
    const shouldOpen = menu.classList.contains('hidden');
    closeNotificationMenus();
    if (shouldOpen) menu.classList.remove('hidden');
  };

  [notificationBell, notificationBellMobile].forEach((btn) => {
    const targetMenu = btn?.id === 'notification-bell' ? notificationMenu : notificationMenuMobile;
    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNotificationMenu(targetMenu);
    });
  });

  document.addEventListener('click', (event) => {
    if (
      !notificationMenu?.contains(event.target) &&
      !notificationBell?.contains(event.target) &&
      !notificationMenuMobile?.contains(event.target) &&
      !notificationBellMobile?.contains(event.target)
    ) {
      closeNotificationMenus();
    }
  });

  const hideSiteNotice = () => {
    siteNoticeContainer?.classList.add('hidden');
    siteNoticeState = null;
  };

  const isNoticeDismissed = (notice) => {
    if (!notice?.createdAt) return false;
    const dismissedAt = Number(localStorage.getItem(noticeDismissKey) || 0);
    return dismissedAt >= Number(notice.createdAt);
  };

  const showSiteNotice = (notice) => {
    if (!siteNoticeBar || !siteNoticeMessage || !siteNoticePill) return;
    const style = noticeStyles[notice.style] || noticeStyles.info;

    siteNoticeBar.className = `rounded-xl border px-4 py-3 shadow-lg ${style.bar}`;
    siteNoticeMessage.textContent = notice.message;
    siteNoticePill.className = `inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style.pill}`;
    siteNoticePill.innerHTML = `<i class="fas ${style.icon}"></i> ${style.label}`;

    if (notice.ctaText && notice.ctaUrl) {
      siteNoticeCta.textContent = notice.ctaText;
      siteNoticeCta.href = notice.ctaUrl;
      siteNoticeCta.className = `text-xs font-semibold underline decoration-2 underline-offset-4 ${style.cta}`;
      siteNoticeCta.classList.remove('hidden');
    } else if (siteNoticeCta) {
      siteNoticeCta.classList.add('hidden');
    }

    siteNoticeContainer?.classList.remove('hidden');
    siteNoticeState = notice;
  };

  const renderNotificationCards = (container, notice) => {
    if (!container) return;
    container.innerHTML = '';

    const hasNotice = notice && notice.active && notice.message && !isNoticeDismissed(notice);

    if (!hasNotice) {
      const empty = document.createElement('div');
      empty.className = 'rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200';
      empty.textContent = 'No notifications yet.';
      container.appendChild(empty);
      return;
    }

    const style = noticeStyles[notice.style] || noticeStyles.info;

    const card = document.createElement('div');
    card.className = 'space-y-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800/70';

    const headerRow = document.createElement('div');
    headerRow.className = 'flex items-center justify-between gap-3';

    const label = document.createElement('span');
    label.className = `inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${style.pill}`;
    label.innerHTML = `<i class="fas ${style.icon}"></i> ${style.label}`;

    const created = document.createElement('span');
    created.className = 'text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-300';
    created.textContent = 'Announcement';

    headerRow.append(label, created);

    const message = document.createElement('p');
    message.className = 'text-sm font-medium leading-relaxed text-gray-900 dark:text-slate-100';
    message.textContent = notice.message;

    card.append(headerRow, message);

    if (notice.ctaText && notice.ctaUrl) {
      const cta = document.createElement('a');
      cta.className = 'inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 underline decoration-2 underline-offset-4 hover:text-indigo-700 dark:text-indigo-200 dark:hover:text-indigo-100';
      cta.href = notice.ctaUrl;
      cta.target = '_blank';
      cta.rel = 'noopener';
      cta.textContent = notice.ctaText;
      cta.insertAdjacentHTML('beforeend', '<i class="fas fa-arrow-up-right-from-square text-[11px]"></i>');
      card.appendChild(cta);
    }

    container.appendChild(card);
  };

  const renderSiteNotice = (notice) => {
    if (!notice || !notice.active || !notice.message || isNoticeDismissed(notice)) {
      hideSiteNotice();
      renderNotificationCards(notificationList, null);
      renderNotificationCards(notificationListMobile, null);
      notificationBadge?.classList.add('hidden');
      notificationBadgeMobile?.classList.add('hidden');
      return;
    }
    showSiteNotice(notice);
    renderNotificationCards(notificationList, notice);
    renderNotificationCards(notificationListMobile, notice);
    notificationBadge?.classList.remove('hidden');
    notificationBadgeMobile?.classList.remove('hidden');
  };

  siteNoticeClose?.addEventListener('click', () => {
    if (siteNoticeState?.createdAt) {
      localStorage.setItem(noticeDismissKey, String(siteNoticeState.createdAt));
    }
    hideSiteNotice();
    renderNotificationCards(notificationList, null);
    renderNotificationCards(notificationListMobile, null);
    notificationBadge?.classList.add('hidden');
    notificationBadgeMobile?.classList.add('hidden');
  });

  const initSiteNotice = () => {
    if (!window.firebase?.database) return;
    firebase.database().ref('siteNotification').on('value', (snap) => {
      renderSiteNotice(snap.val());
    });
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

document.addEventListener("DOMContentLoaded", async () => {
  const header = document.querySelector("header");
  if (!header) return;

  const ensureStyles = () => {
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
  };

  const injectHeader = async () => {
    try {
      const response = await fetch('components/header.html');
      if (!response.ok) throw new Error('Header fetch failed');
      const html = await response.text();
      header.innerHTML = html;
    } catch (err) {
      console.error('Unable to load header.html', err);
    }
  };

  const highlightActiveNav = () => {
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
  };

  const setupBrandSpinner = () => {
    const brandSpinner = header.querySelector('[data-brand-spinner]');
    const animationDuration = 2600;

    const triggerBrandAnimation = () => {
      if (!brandSpinner) return;
      brandSpinner.classList.remove('is-animating');
      void brandSpinner.offsetWidth;
      brandSpinner.classList.add('is-animating');

      clearTimeout(brandSpinner.animationTimeout);
      brandSpinner.animationTimeout = setTimeout(() => {
        brandSpinner.classList.remove('is-animating');
      }, animationDuration);
    };

    if (brandSpinner) {
      triggerBrandAnimation();
      brandSpinner.addEventListener('mouseenter', triggerBrandAnimation);
    }
  };

  const setupThemeControls = () => {
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
  };

  ensureStyles();
  await injectHeader();
  highlightActiveNav();
  setupBrandSpinner();
  setupThemeControls();
});

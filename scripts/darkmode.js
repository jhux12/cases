// Handles dark mode toggle and persistence

function initThemeToggles() {
  const root = document.documentElement;
  const toggles = document.querySelectorAll('#theme-toggle, #theme-toggle-mobile');

  const setTheme = (isDark) => {
    root.classList.toggle('dark', isDark);
    toggles.forEach(btn => {
      btn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
  };

  const stored = localStorage.getItem('theme');
  if (stored === 'dark') {
    setTheme(true);
  }

  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = !root.classList.contains('dark');
      setTheme(isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeToggles);
} else {
  initThemeToggles();
}

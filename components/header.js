function loadHeader() {
  fetch('/components/header.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('main-header').innerHTML = html;

      const dropdownToggle = document.getElementById('dropdown-toggle');
      const dropdown = document.getElementById('user-dropdown');
      const closeProfileMenu = () => {
        if (!dropdownToggle || !dropdown) return;
        dropdown.classList.add('hidden');
        dropdownToggle.setAttribute('aria-expanded', 'false');
      };

      if (dropdownToggle && dropdown) {
        dropdownToggle.addEventListener('click', event => {
          event.stopPropagation();
          const expanded = dropdownToggle.getAttribute('aria-expanded') === 'true';
          dropdown.classList.toggle('hidden', expanded);
          dropdownToggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });

        document.addEventListener('click', event => {
          if (!dropdown.contains(event.target) && event.target !== dropdownToggle) {
            closeProfileMenu();
          }
        });

        document.addEventListener('keydown', event => {
          if (event.key === 'Escape') {
            closeProfileMenu();
          }
        });
      }

      const menuToggle = document.getElementById('menu-toggle');
      const mobileDropdown = document.getElementById('mobile-dropdown');
      const toggleMobileMenu = open => {
        if (!menuToggle || !mobileDropdown) return;
        const isOpen = typeof open === 'boolean' ? open : mobileDropdown.classList.contains('hidden');
        mobileDropdown.classList.toggle('hidden', !isOpen);
        menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        document.body.classList.toggle('overflow-hidden', isOpen);
      };

      if (menuToggle && mobileDropdown) {
        menuToggle.addEventListener('click', () => toggleMobileMenu());

        mobileDropdown.querySelectorAll('a').forEach(link => {
          link.addEventListener('click', () => toggleMobileMenu(false));
        });

        document.addEventListener('keydown', event => {
          if (event.key === 'Escape') {
            toggleMobileMenu(false);
          }
        });

        window.addEventListener('resize', () => {
          if (window.innerWidth >= 1024) {
            toggleMobileMenu(false);
          }
        });
      }
    });
}

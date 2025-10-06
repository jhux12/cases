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
      let hideMenuTimeout;

      const toggleMobileMenu = open => {
        if (!menuToggle || !mobileDropdown) return;

        const shouldOpen =
          typeof open === 'boolean' ? open : mobileDropdown.classList.contains('hidden');

        clearTimeout(hideMenuTimeout);

        if (shouldOpen) {
          mobileDropdown.classList.remove('hidden');
          requestAnimationFrame(() => {
            mobileDropdown.classList.add('mobile-menu--open');
          });
          menuToggle.setAttribute('aria-expanded', 'true');
          document.body.classList.add('mobile-menu-open');
        } else {
          mobileDropdown.classList.remove('mobile-menu--open');
          menuToggle.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('mobile-menu-open');
          hideMenuTimeout = setTimeout(() => {
            mobileDropdown.classList.add('hidden');
          }, 250);
        }
      };

      if (menuToggle && mobileDropdown) {
        menuToggle.addEventListener('click', () => toggleMobileMenu());

        mobileDropdown.querySelectorAll('a').forEach(link => {
          link.addEventListener('click', () => toggleMobileMenu(false));
        });

        mobileDropdown.querySelectorAll('[data-menu-close]').forEach(element => {
          element.addEventListener('click', () => toggleMobileMenu(false));
        });

        document.addEventListener('keydown', event => {
          if (event.key === 'Escape') {
            toggleMobileMenu(false);
            closeProfileMenu();
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

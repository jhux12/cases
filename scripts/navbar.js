document.addEventListener('DOMContentLoaded', () => {
  // Hamburger toggle
  const menuToggle = document.getElementById('menu-toggle');
  const mobileDropdown = document.getElementById('mobile-dropdown');

  if (menuToggle && mobileDropdown) {
    menuToggle.addEventListener('click', () => {
      mobileDropdown.classList.toggle('hidden');
    });
  }

  // Username dropdown toggle
  const dropdownToggle = document.getElementById('dropdown-toggle');
  const userDropdown = document.getElementById('user-dropdown');

  if (dropdownToggle && userDropdown) {
    dropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });

    window.addEventListener('click', (e) => {
      if (!userDropdown.contains(e.target)) {
        userDropdown.classList.add('hidden');
      }
    });
  }
});


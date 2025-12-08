function loadHeader() {
  fetch('/components/header.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('main-header').innerHTML = html;

      // Optional: reattach any events here if needed
      const dropdownToggle = document.getElementById("dropdown-toggle");
      const dropdown = document.getElementById("user-dropdown");

      if (dropdownToggle && dropdown) {
        dropdownToggle.onclick = () => dropdown.classList.toggle("hidden");
      }

      const menuToggle = document.getElementById("menu-toggle");
      const mobileDropdown = document.getElementById("mobile-dropdown");
      if (menuToggle && mobileDropdown) {
        menuToggle.onclick = () => mobileDropdown.classList.toggle("hidden");
      }

      const brandSpinner = document.querySelector('[data-brand-spinner]');
      const animationDuration = 2600;

      const triggerBrandAnimation = () => {
        if (!brandSpinner) return;
        brandSpinner.classList.remove('is-animating');
        // force reflow so animation can restart
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
    });
}

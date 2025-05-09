document.addEventListener("DOMContentLoaded", () => {
  // Dropdown toggle
  const dropdownToggle = document.getElementById("dropdown-toggle");
  const userDropdown = document.getElementById("user-dropdown");

  if (dropdownToggle && userDropdown) {
    dropdownToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (
        !userDropdown.classList.contains("hidden") &&
        !userDropdown.contains(e.target) &&
        !dropdownToggle.contains(e.target)
      ) {
        userDropdown.classList.add("hidden");
      }
    });
  }

  // Mobile menu toggle
  const menuToggle = document.getElementById("menu-toggle");
  const mobileDropdown = document.getElementById("mobile-dropdown");

  if (menuToggle && mobileDropdown) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      mobileDropdown.classList.toggle("hidden");
    });

    document.addEventListener("click", (event) => {
      if (
        !mobileDropdown.classList.contains("hidden") &&
        !mobileDropdown.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        mobileDropdown.classList.add("hidden");
      }
    });
  }
});


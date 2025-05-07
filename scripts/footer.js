// scripts/footer.js

document.addEventListener('DOMContentLoaded', () => {
  const footer = document.querySelector('footer');
  if (footer) {
    const year = new Date().getFullYear();
    footer.innerHTML = `&copy; ${year} Packly.gg. All rights reserved.`;
  }
});


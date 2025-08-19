document.addEventListener('DOMContentLoaded', () => {
  const footer = document.querySelector('footer');
    if (footer) {
      const year = new Date().getFullYear();
      footer.className = 'crazy-footer text-white py-8 px-6';
      footer.innerHTML = `
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">

          <div class="text-sm text-gray-400 text-center md:text-left">
            &copy; ${year} Packly.gg. All rights reserved.
          </div>

          <div class="flex flex-wrap justify-center md:justify-end items-center gap-6 text-sm">
            <a href="faq.html" class="nav-link text-pink-400"><i class="fas fa-question-circle"></i><span>FAQ</span></a>
            <a href="termsandconditions.html" class="nav-link text-yellow-400"><i class="fas fa-scroll"></i><span>Terms & Conditions</span></a>
            <a href="contact.html" class="nav-link text-blue-400"><i class="fas fa-envelope"></i><span>Contact</span></a>
            <a href="https://instagram.com/packly.gg" target="_blank" class="nav-link text-purple-400">
              <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm5.5-.88a.88.88 0 1 1-1.75 0 .88.88 0 0 1 1.75 0Z"/></svg>
              <span>Instagram</span>
            </a>
          </div>

        </div>

        <div class="text-center mt-6 text-sm text-gray-400">
          Packly.gg – Where virtual packs ignite real hype ❤️
        </div>
      `;
    }
  });

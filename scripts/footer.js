document.addEventListener('DOMContentLoaded', () => {
  const footer = document.querySelector('footer');
  if (!footer) return;
  const year = new Date().getFullYear();
  footer.innerHTML = `
    <div class="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
      <nav class="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
        <div class="px-5 py-2"><a href="faq.html" class="text-base text-gray-500 hover:text-gray-900">FAQ</a></div>
        <div class="px-5 py-2"><a href="termsandconditions.html" class="text-base text-gray-500 hover:text-gray-900">Terms &amp; Conditions</a></div>
        <div class="px-5 py-2"><a href="contact.html" class="text-base text-gray-500 hover:text-gray-900">Contact</a></div>
        <div class="px-5 py-2"><a href="https://instagram.com/pullz.gg" class="text-base text-gray-500 hover:text-gray-900" target="_blank">Instagram</a></div>
      </nav>
      <div class="mt-8 flex justify-center space-x-6">
        <a href="#" class="text-gray-400 hover:text-gray-500"><span class="sr-only">Facebook</span><i class="fab fa-facebook-f"></i></a>
        <a href="#" class="text-gray-400 hover:text-gray-500"><span class="sr-only">Twitter</span><i class="fab fa-twitter"></i></a>
        <a href="#" class="text-gray-400 hover:text-gray-500"><span class="sr-only">Instagram</span><i class="fab fa-instagram"></i></a>
        <a href="#" class="text-gray-400 hover:text-gray-500"><span class="sr-only">Discord</span><i class="fab fa-discord"></i></a>
      </div>
      <p class="mt-8 text-center text-base text-gray-400">© ${year} Pullz.gg. All rights reserved.</p>
      <p class="mt-2 text-center text-sm text-gray-500">Pullz.gg – Where virtual packs ignite real hype ❤️</p>
    </div>
  `;
});

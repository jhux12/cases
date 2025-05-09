document.addEventListener('DOMContentLoaded', () => {
  const featuresSection = document.createElement('section');
  featuresSection.className = 'bg-[#0f0f12] py-16 px-6 text-white border-t border-gray-800';
  featuresSection.innerHTML = `
    <div class="max-w-7xl mx-auto text-center">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
        <div class="p-4 rounded-lg hover:scale-105 transition duration-300">
          <div class="flex justify-center mb-4">
            <div class="bg-purple-600 p-4 rounded-full shadow-md">
              <i class="fas fa-certificate fa-beat text-2xl text-white"></i>
            </div>
          </div>
          <h3 class="text-lg font-extrabold text-purple-300 mb-2">100% Authentic Items</h3>
          <p class="text-gray-400 text-sm">
            Every item is verified from trusted sources like StockX and official retailers. Real gear, guaranteed.
          </p>
        </div>
        <div class="p-4 rounded-lg hover:scale-105 transition duration-300">
          <div class="flex justify-center mb-4">
            <div class="bg-purple-600 p-4 rounded-full shadow-md">
              <i class="fas fa-exchange-alt fa-fade text-2xl text-white"></i>
            </div>
          </div>
          <h3 class="text-lg font-extrabold text-purple-300 mb-2">Exchange or Re-Roll</h3>
          <p class="text-gray-400 text-sm">
            Don’t want it? Instantly trade or sell back for coins. No fees. No wait.
          </p>
        </div>
        <div class="p-4 rounded-lg hover:scale-105 transition duration-300">
          <div class="flex justify-center mb-4">
            <div class="bg-purple-600 p-4 rounded-full shadow-md">
              <i class="fas fa-truck-fast fa-bounce text-2xl text-white"></i>
            </div>
          </div>
          <h3 class="text-lg font-extrabold text-purple-300 mb-2">Fast Global Shipping</h3>
          <p class="text-gray-400 text-sm">
            We ship worldwide. Or keep it digital by converting items into coin instantly.
          </p>
        </div>
      </div>

      <div class="mt-12">
        <h4 class="text-sm uppercase text-gray-500 tracking-widest mb-4">Accepted Payment Methods</h4>
        <div class="flex justify-center items-center gap-6 flex-wrap">
          <img src="https://cdn-icons-png.flaticon.com/128/349/349221.png" alt="Visa" class="h-8">
          <img src="https://cdn-icons-png.flaticon.com/128/11378/11378185.png" alt="MasterCard" class="h-8">
          <img src="https://cdn-icons-png.flaticon.com/128/179/179431.png" alt="Amex" class="h-8">
          <img src="https://cdn-icons-png.flaticon.com/128/5968/5968279.png" alt="Apple Pay" class="h-8">
          <img src="https://cdn-icons-png.flaticon.com/128/6124/6124998.png" alt="Google Pay" class="h-8">
        </div>
      </div>
    </div>
  `;

  document.body.insertBefore(featuresSection, document.querySelector('footer'));
});

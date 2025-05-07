document.addEventListener('DOMContentLoaded', () => {
  const featuresSection = document.createElement('section');
  featuresSection.className = 'bg-[#0f0f12] py-16 px-6 text-white';
  featuresSection.innerHTML = `
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
      <div>
        <div class="flex justify-center mb-4">
          <div class="bg-purple-600 p-4 rounded-full">
            <i class="fas fa-certificate text-2xl text-white"></i>
          </div>
        </div>
        <h3 class="text-lg font-extrabold text-purple-300 mb-2">100% Authentic Items</h3>
        <p class="text-gray-300 text-sm">
          Every item is verified authentic from trusted sources like StockX or official retailers, guaranteeing the real deal every time.
        </p>
      </div>
      <div>
        <div class="flex justify-center mb-4">
          <div class="bg-purple-600 p-4 rounded-full">
            <i class="fas fa-exchange-alt text-2xl text-white"></i>
          </div>
        </div>
        <h3 class="text-lg font-extrabold text-purple-300 mb-2">Exchange Unwanted Items</h3>
        <p class="text-gray-300 text-sm">
          Turn items into coins instantly. Trade, sell, or re-roll with no fees or hidden costs—your items, your choice.
        </p>
      </div>
      <div>
        <div class="flex justify-center mb-4">
          <div class="bg-purple-600 p-4 rounded-full">
            <i class="fas fa-shipping-fast text-2xl text-white"></i>
          </div>
        </div>
        <h3 class="text-lg font-extrabold text-purple-300 mb-2">Worldwide Shipping</h3>
        <p class="text-gray-300 text-sm">
          Claim your prize and have it shipped anywhere globally, or convert it into coin balance instantly.
        </p>
      </div>
    </div>
  `;

  document.body.insertBefore(featuresSection, document.querySelector('footer'));
});


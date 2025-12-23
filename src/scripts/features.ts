// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {
  const featuresSection = document.createElement('section');
  featuresSection.className = 'bg-gradient-to-b from-[#1f1f2b] to-[#12121b] py-20 px-6 text-white border-t border-gray-800';
  featuresSection.innerHTML = `
    <div class="max-w-6xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div class="flex flex-col items-center p-6 rounded-xl bg-[#1a1a23]/60 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500 transition">
          <div class="mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <i class="fas fa-certificate text-2xl"></i>
          </div>
          <h3 class="text-lg font-semibold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">100% Authentic Items</h3>
          <p class="text-sm text-gray-400">
            Every item is verified from trusted sources like StockX and official retailers. Real gear, guaranteed.
          </p>
        </div>
        <div class="flex flex-col items-center p-6 rounded-xl bg-[#1a1a23]/60 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500 transition">
          <div class="mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <i class="fas fa-exchange-alt text-2xl"></i>
          </div>
          <h3 class="text-lg font-semibold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Exchange or Re-Roll</h3>
          <p class="text-sm text-gray-400">
            Don’t want it? Instantly trade or sell back for gems. No fees. No wait.
          </p>
        </div>
        <div class="flex flex-col items-center p-6 rounded-xl bg-[#1a1a23]/60 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500 transition">
          <div class="mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <i class="fas fa-truck-fast text-2xl"></i>
          </div>
          <h3 class="text-lg font-semibold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Fast Global Shipping</h3>
          <p class="text-sm text-gray-400">
            We ship worldwide. Or keep it digital by converting items into gems instantly.
          </p>
        </div>
      </div>

      <div class="mt-16 text-center">
        <h4 class="text-xs uppercase text-gray-400 tracking-widest mb-6">Accepted Payment Methods</h4>
        <div class="flex justify-center items-center gap-6 flex-wrap opacity-80">
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

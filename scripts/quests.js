// scripts/quests.js

export function renderDailyQuests(containerId = "quest-container") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="bg-gradient-to-br from-[#1f1f2b] to-[#12121b] rounded-2xl p-6 sm:p-8 shadow-xl text-white w-full max-w-3xl mx-auto">
      <h2 class="text-3xl font-bold text-center mb-6 text-yellow-300 tracking-tight">🎯 Daily Quests</h2>
      <ul class="space-y-4">
        <li class="flex items-center justify-between bg-gray-900 border border-yellow-500 rounded-xl px-6 py-4 shadow-lg hover:scale-[1.01] transition-transform">
          <div class="flex items-center gap-3">
            <i class="fas fa-box-open text-yellow-400 text-lg"></i>
            <span class="text-white font-medium">Open 1 Pack</span>
          </div>
          <button class="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-1.5 px-5 rounded-full text-sm transition">Claim</button>
        </li>
        <li class="flex items-center justify-between bg-gray-900 border border-yellow-500 rounded-xl px-6 py-4 shadow-lg hover:scale-[1.01] transition-transform">
          <div class="flex items-center gap-3">
            <i class="fas fa-coins text-yellow-400 text-lg"></i>
            <span class="text-white font-medium">Spend 500 Coins</span>
          </div>
          <button class="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-1.5 px-5 rounded-full text-sm transition">Claim</button>
        </li>
        <li class="flex items-center justify-between bg-gray-900 border border-yellow-500 rounded-xl px-6 py-4 shadow-lg hover:scale-[1.01] transition-transform">
          <div class="flex items-center gap-3">
            <i class="fas fa-star text-yellow-400 text-lg"></i>
            <span class="text-white font-medium">Win a Rare Card</span>
          </div>
          <button class="bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-1.5 px-5 rounded-full text-sm transition">Claim</button>
        </li>
      </ul>
    </div>
  `;
}

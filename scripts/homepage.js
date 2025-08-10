document.addEventListener('DOMContentLoaded', () => {
  const db = firebase.database();
  db.ref('homepage').once('value').then(snap => {
    const data = snap.val() || {};
    const hero = data.hero || {};
    if (hero.title) document.getElementById('hero-title').innerHTML = hero.title;
    if (hero.subtitle) document.getElementById('hero-subtitle').innerHTML = hero.subtitle;
    if (hero.background) document.getElementById('hero-image').src = hero.background;

    const vp = data.valueProps || {};
    if (vp.heading) document.getElementById('value-props-heading').textContent = vp.heading;
    const container = document.getElementById('value-props');
    if (container) {
      container.innerHTML = '';
      (vp.items || []).forEach(item => {
        const card = document.createElement('div');
        card.className = 'highlight-card group bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-pink-500 hover:bg-white/10 transition-all duration-700 opacity-0 translate-y-8';
        card.innerHTML = `
        <div class="w-14 h-14 mb-5 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg group-hover:scale-110 transition">
          <i class="fa-solid ${item.icon || ''} text-2xl"></i>
        </div>
        <h3 class="text-xl font-semibold mb-2">${item.title || ''}</h3>
        <p class="text-gray-400 text-sm">${item.desc || ''}</p>
      `;
        container.appendChild(card);
      });
    }
    const trendingContainer = document.getElementById('trending-container');
    if (trendingContainer) {
      trendingContainer.innerHTML = '';
      (data.trending || []).forEach(item => {
        const card = document.createElement('div');
        card.className = 'trending-card relative group opacity-0 translate-y-8';
        card.innerHTML = `
          <img src="${item.image || ''}" alt="${item.title || ''}" class="w-full h-56 object-cover rounded-2xl">
          ${item.badge ? `<span class="absolute top-3 left-3 ${item.badgeClass || 'bg-red-600'} text-xs uppercase tracking-wide px-2 py-1 rounded">${item.badge}</span>` : ''}
          <div class="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition">
            <h3 class="text-xl font-semibold mb-2">${item.title || ''}</h3>
            <a href="${item.link || 'packs.html'}" class="px-4 py-2 bg-gradient-to-r from-yellow-400 to-pink-500 text-black rounded-full font-bold">Rip Now</a>
          </div>`;
        trendingContainer.appendChild(card);
      });
    }

    const testimonialContainer = document.getElementById('testimonial-list');
    if (testimonialContainer) {
      testimonialContainer.innerHTML = '';
      (data.testimonials || []).forEach(item => {
        const stars = Array.from({ length: 5 }, (_, i) => `<i class="fa-${i < (item.rating || 0) ? 'solid' : 'regular'} fa-star"></i>`).join('');
        const card = document.createElement('div');
        card.className = 'bg-white/5 p-6 rounded-2xl border border-white/10';
        card.innerHTML = `
          <div class="flex items-center mb-4">
            <img src="${item.avatar || ''}" alt="${item.name || ''}" class="w-12 h-12 rounded-full mr-4">
            <div>
              <p class="font-semibold">${item.name || ''}</p>
              <div class="text-yellow-400 text-sm">${stars}</div>
            </div>
          </div>
          <p class="text-gray-300 text-sm">${item.text || ''}</p>`;
        testimonialContainer.appendChild(card);
      });
    }

    document.dispatchEvent(new Event('homepageDataLoaded'));
  });
});

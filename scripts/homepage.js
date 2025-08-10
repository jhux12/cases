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
    document.dispatchEvent(new Event('homepageDataLoaded'));
  });
});

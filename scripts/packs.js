function loadCases() {
  const casesContainer = document.getElementById("cases-container");
  
  // Use global Firebase compat SDK
  firebase.database().ref("cases").on("value", snapshot => {
    casesContainer.innerHTML = "";

    snapshot.forEach(child => {
      const data = child.val();

      const tagHTML = data.tag
        ? `<div class="absolute top-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded-full font-bold z-10">${data.tag}</div>`
        : "";

      casesContainer.innerHTML += `
        <div class="relative p-4 bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition">
          ${tagHTML}
          <img src="${data.image}" class="case-card-img mb-2">
          <h3 class="mt-2 font-semibold text-white">${data.name}</h3>
          <button class="mt-2 w-full py-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded open-case glow-button enhanced-glow flex justify-center items-center gap-2 text-white font-semibold" data-id="${child.key}">
            Open for ${(parseFloat(data.price) || 0).toLocaleString()}
            <img src="https://cdn-icons-png.flaticon.com/128/6369/6369589.png" alt="Coin" class="w-4 h-4 inline-block">
          </button>
        </div>`;
    });

    document.querySelectorAll(".open-case").forEach(btn => {
      btn.onclick = openCasePopup;
    });
  });
}

(function (global) {
  const state = {
    root: null,
    items: [],
    isSpinning: false,
    listeners: {},
    muted: false,
    tileWidth: 132,
    cruiseEmitted: false,
    animationId: null,
  };

  const rarityColors = {
    common: "#b6bdc9",
    uncommon: "#8FE3C9",
    rare: "#A6C8FF",
    ultra: "#C9A7FF",
    ultrarare: "#C9A7FF",
    legendary: "#FFD36E",
  };

  function emit(name, data) {
    (state.listeners[name] || []).forEach((fn) => fn(data));
  }
  function on(name, handler) {
    (state.listeners[name] || (state.listeners[name] = [])).push(handler);
  }

  function render() {
    if (!state.root) return;
    state.root.innerHTML = "";
    if (state.items.length === 0) {
      const msg = document.createElement("div");
      msg.className = "tile";
      msg.style.background = "transparent";
      msg.style.boxShadow = "none";
      msg.textContent = "No items";
      state.root.appendChild(msg);
      return;
    }
    const frag = document.createDocumentFragment();
    const copies = 5;
    for (let c = 0; c < copies; c++) {
      state.items.forEach((item) => {
        const tile = document.createElement("div");
        tile.className = `tile rarity-${item.rarity || "common"}`;
        tile.dataset.id = item.id;
        const priceHtml =
          item.value !== undefined
            ? `<div class="price">${Number(item.value).toLocaleString()}<img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/diamond.png?alt=media&token=244f4b80-1832-4c7c-89da-747a1f8457ff" alt="Gem"/></div>`
            : "";
        tile.innerHTML = `<img src="${item.image}" alt="${item.name}"/><div class="tile-info"><div class="name">${item.name}</div>${priceHtml}</div>`;
        tile.style.borderColor = rarityColors[item.rarity] || "#3a4050";
        frag.appendChild(tile);
      });
    }
    state.root.appendChild(frag);
    state.root.style.transition = "none";
    state.root.style.transform = "translate3d(0,0,0)";
    const firstTile = state.root.querySelector(".tile");
    if (firstTile) {
      const rect = firstTile.getBoundingClientRect();
      const style = getComputedStyle(firstTile);
      state.tileWidth =
        rect.width +
        parseFloat(style.marginLeft) +
        parseFloat(style.marginRight);
    }
  }

  function init({ root, items }) {
    state.root = root;
    setItems(items || []);
  }
  function setItems(items) {
    state.items = items.slice();
    render();
  }
  function isSpinning() {
    return state.isSpinning;
  }

  function setMuted(v) {
    state.muted = v;
  }

  function playTick() {
    if (state.muted) return;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    osc.type = "triangle";

    const base = 420 + Math.random() * 180;
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.8, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(base * 0.72, now + 0.2);

    const drive = ctx.createWaveShaper();
    drive.curve = makeSaturationCurve();
    drive.oversample = "4x";

    const tone = ctx.createBiquadFilter();
    tone.type = "bandpass";
    tone.frequency.setValueAtTime(base * 1.6, now);
    tone.Q.value = 11;

    const toneGain = ctx.createGain();
    toneGain.gain.setValueAtTime(0.0008, now);
    toneGain.gain.exponentialRampToValueAtTime(0.14, now + 0.025);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(base * 1.1, now);
    noiseFilter.Q.value = 0.9;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pan) {
      const swing = (Math.random() * 1.4 - 0.7) * 0.8;
      pan.pan.setValueAtTime(swing, now);
      osc.connect(drive).connect(tone).connect(toneGain).connect(pan);
      noise.connect(noiseFilter).connect(noiseGain).connect(pan);
      pan.connect(ctx.destination);
    } else {
      osc.connect(drive).connect(tone).connect(toneGain).connect(ctx.destination);
      noise.connect(noiseFilter).connect(noiseGain).connect(ctx.destination);
    }

    osc.start();
    osc.stop(now + 0.26);
    noise.start(now);
    noise.stop(now + 0.18);
  }

  let audioCtx;
  function getCtx() {
    return (
      audioCtx || (audioCtx = new (window.AudioContext || window.webkitAudioContext)())
    );
  }

  function makeSaturationCurve() {
    const samples = 22050;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((1 + 60) * x) / (1 + 60 * Math.abs(x));
    }
    return curve;
  }

  function stinger(rarity) {
    if (state.muted) return;
    const freq =
      { common: 400, uncommon: 500, rare: 600, ultra: 700, ultrarare: 700, legendary: 800 }[
        rarity
      ] || 500;
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }

  function burstConfetti() {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    state.root.appendChild(container);
    for (let i = 0; i < 20; i++) {
      const c = document.createElement("div");
      c.className = "confetti";
      c.style.left = Math.random() * 20 - 10 + "px";
      c.style.background = ["#FFD36E", "#A6C8FF", "#8FE3C9", "#C9A7FF"][i % 4];
      container.appendChild(c);
    }
    setTimeout(() => container.remove(), 700);
  }

  function applySpecialLanding(targetIndex, item, opts) {
    if (!opts.specialLandingImage || !state.root) return;
    const tiles = state.root.children;
    const landingTile = tiles[targetIndex];
    if (!landingTile) return;

    const priceHtml =
      item.value !== undefined
        ? `<div class="price">${Number(item.value).toLocaleString()}<img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/diamond.png?alt=media&token=244f4b80-1832-4c7c-89da-747a1f8457ff" alt="Gem"/></div>`
        : "";

    const label = opts.specialLandingLabel || item.name;
    const showInfo = !opts.specialLandingHideInfo;

    landingTile.classList.add("special-landing");
    landingTile.innerHTML = `
      <div class="special-landing__glow"></div>
      <img src="${opts.specialLandingImage}" alt="${label || "Special prize"}"/>
      ${
        showInfo
          ? `<div class="tile-info special-landing__info">
               <div class="name">${label}</div>
               ${priceHtml}
             </div>`
          : ""
      }
    `;
  }

  function spinToIndex(index, opts = {}) {
    if (state.isSpinning || !state.root) return;
    if (state.animationId) cancelAnimationFrame(state.animationId);

    render();
    Array.from(state.root.children).forEach((t) => t.classList.remove("win"));
    state.root.style.transform = "translate3d(0,0,0)";

    const startX = 0;
    const duration = opts.durationMs || 2400;
    state.isSpinning = true;

    const tiles = state.root.children;
    const midStart = state.items.length * 2;
    let offset = 0;

    if (opts.nearMiss && Math.random() < 0.25) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const candidates = state.items.filter(
        (it, i) =>
          i !== index && ["legendary", "ultra", "ultrarare"].includes(it.rarity)
      );
      const it = candidates[Math.floor(Math.random() * candidates.length)];
      if (it) {
        const clone = document.createElement("div");
        clone.className = "tile";
        const priceHtml =
          it.value !== undefined
            ? `<div class="price">${Number(it.value).toLocaleString()}<img src="https://firebasestorage.googleapis.com/v0/b/cases-e5b4e.firebasestorage.app/o/diamond.png?alt=media&token=244f4b80-1832-4c7c-89da-747a1f8457ff" alt="Gem"/></div>`
            : "";
        clone.innerHTML = `<img src="${it.image}" alt="${it.name}"/><div class="tile-info"><div class="name">${it.name}</div>${priceHtml}</div>`;
        tiles[midStart + index + (dir === 1 ? -1 : 1)].replaceWith(clone);
        offset = state.tileWidth * 0.35 * dir;
      }
    }

    const container = state.root.parentElement;
    const containerWidth = container.getBoundingClientRect().width;
    const centerOffset = containerWidth / 2 - state.tileWidth / 2;

    const targetIndex = state.items.length * 2 + index;
    const winningItem = state.items[index];
    const perfectX = -(targetIndex * state.tileWidth - centerOffset);
    const finalX = perfectX + offset;
    const distance = finalX - startX;

    if (opts.specialLandingImage && winningItem) {
      applySpecialLanding(targetIndex, winningItem, opts);
    }

    // heavier deceleration for slower end spin
    const accDur = duration * 0.25,
      decelDur = duration * 0.45,
      cruiseDur = duration - accDur - decelDur;
    const accDist = distance * (accDur / duration),
      decelDist = distance * (decelDur / duration),
      cruiseDist = distance - accDist - decelDist;

    let lastTick = 0,
      start = null;
    emit("start");

    function easeInCubic(t) {
      return t * t * t;
    }
    function easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4);
    }

    function step(timestamp) {
      if (start === null) start = timestamp;
      const elapsed = timestamp - start;
      let delta = 0;

      if (elapsed < accDur) {
        delta = easeInCubic(elapsed / accDur) * accDist;
      } else if (elapsed < accDur + cruiseDur) {
        const t = (elapsed - accDur) / cruiseDur;
        delta = accDist + t * cruiseDist;
        if (!state.cruiseEmitted) {
          emit("cruise");
          state.cruiseEmitted = true;
        }
      } else if (elapsed < duration) {
        const t = (elapsed - accDur - cruiseDur) / decelDur;
        delta = accDist + cruiseDist + easeOutQuart(t) * decelDist;
      } else {
        delta = distance;
      }

      const pos = startX + delta;
      state.root.style.transform = `translate3d(${pos}px,0,0)`;
      if (timestamp - lastTick > 120) {
        playTick();
        lastTick = timestamp;
      }

      if (elapsed < duration) {
        state.animationId = requestAnimationFrame(step);
      } else {
        state.animationId = null;
        state.root.style.transform = `translate3d(${finalX}px,0,0)`;
        state.isSpinning = false;
        state.cruiseEmitted = false;

        const item = state.items[index];
        const winTile = state.root.children[targetIndex];
        winTile.style.setProperty(
          "--win-color",
          rarityColors[item.rarity] || "#FFD36E"
        );
        winTile.classList.add("win");
        stinger(item.rarity);
        burstConfetti();
        emit("reveal", item);
        opts.onReveal && opts.onReveal(item);
        emit("finish", item);

        if (offset !== 0) {
          setTimeout(() => {
            state.root.style.transition = "transform 0.25s";
            state.root.style.transform = `translate3d(${perfectX}px,0,0)`;
            setTimeout(() => {
              state.root.style.transition = "none";
            }, 300);
          }, 300);
        }
      }
    }

    state.animationId = requestAnimationFrame(step);
  }

  function getCurrentX() {
    const style = getComputedStyle(state.root);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return matrix.m41;
  }

  function snapToIndex(index, opts = {}) {
    if (!state.root || state.isSpinning || index < 0 || index >= state.items.length)
      return;

    if (state.animationId) {
      cancelAnimationFrame(state.animationId);
      state.animationId = null;
    }

    if (opts.refresh) {
      render();
    }

    const tiles = state.root.children;
    if (!tiles.length) return;

    const container = state.root.parentElement;
    const containerWidth = container.getBoundingClientRect().width;
    const centerOffset = containerWidth / 2 - state.tileWidth / 2;
    const targetIndex = state.items.length * 2 + index;
    const perfectX = -(targetIndex * state.tileWidth - centerOffset);

    state.root.style.transition = "none";
    state.root.style.transform = `translate3d(${perfectX}px,0,0)`;

    Array.from(tiles).forEach((t) => t.classList.remove("win"));

    const winningItem = state.items[index];
    const winTile = tiles[targetIndex];
    if (opts.markWin && winningItem && winTile) {
      winTile.style.setProperty(
        "--win-color",
        rarityColors[winningItem.rarity] || "#FFD36E"
      );
      winTile.classList.add("win");
    }
  }

  global.PackOpener = {
    init,
    setItems,
    isSpinning,
    spinToIndex,
    snapToIndex,
    on,
    setMuted,
    _state: state,
  };
})(window);

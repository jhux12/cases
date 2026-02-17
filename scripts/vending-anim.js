// Plain script exposing VendingAnim for the vending-open page
(() => {
  const { Engine, Render, Runner, World, Bodies, Body, Composite, Events } = window.Matter || {};

  if (!Engine) {
    console.warn('Matter.js is required for VendingAnim');
    return;
  }

  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  const rarityColors = {
    common: '#22d3ee',
    rare: '#6366f1',
    epic: '#a855f7',
    legendary: '#f59e0b'
  };

  const state = {
    engine: null,
    render: null,
    runner: null,
    walls: [],
    tokens: [],
    glass: null,
    canvas: null,
    rarities: { common: 40, rare: 30, epic: 20, legendary: 10 }
  };

  const getCounts = (rarities, total = 60) => {
    const entries = Object.entries(rarities).map(([key, value]) => [key, Math.max(0, Number(value) || 0)]);
    const sum = entries.reduce((acc, [, v]) => acc + v, 0) || 1;
    return entries.map(([key, value]) => [key, Math.round((value / sum) * total)]);
  };

  const clearBodies = (items = []) => {
    items.forEach((item) => Composite.remove(state.engine.world, item));
  };

  const rebuildWalls = () => {
    clearBodies(state.walls);
    state.walls = [];

    const w = state.canvas.width;
    const h = state.canvas.height;
    const thickness = 40 * DPR;

    const floor = Bodies.rectangle(w / 2, h + thickness / 2, w + thickness * 2, thickness, { isStatic: true });
    const ceiling = Bodies.rectangle(w / 2, -thickness / 2, w + thickness * 2, thickness, { isStatic: true });
    const left = Bodies.rectangle(-thickness / 2, h / 2, thickness, h + thickness * 2, { isStatic: true });
    const right = Bodies.rectangle(w + thickness / 2, h / 2, thickness, h + thickness * 2, { isStatic: true });

    const rampA = Bodies.rectangle(w * 0.2, h * 0.7, w * 0.55, 18 * DPR, { isStatic: true, angle: -0.25 });
    const rampB = Bodies.rectangle(w * 0.78, h * 0.62, w * 0.45, 18 * DPR, { isStatic: true, angle: 0.22 });

    state.walls.push(floor, ceiling, left, right, rampA, rampB);
    World.add(state.engine.world, state.walls);
  };

  const spawnTokens = () => {
    clearBodies(state.tokens);
    state.tokens = [];

    const w = state.canvas.width;
    const h = state.canvas.height;

    const counts = getCounts(state.rarities, 60);
    counts.forEach(([key, count]) => {
      for (let i = 0; i < count; i++) {
        const radius = (18 + Math.random() * 8) * DPR;
        const x = Math.random() * (w - radius * 2) + radius;
        const y = Math.random() * (h * 0.35) + radius;

        const fill = rarityColors[key] || '#22d3ee';
        const token = Bodies.circle(x, y, radius, {
          restitution: 0.45,
          friction: 0.1,
          frictionAir: 0.02,
          density: 0.0012,
          render: {
            fillStyle: fill,
            strokeStyle: '#0f172a',
            lineWidth: 1.5 * DPR
          }
        });

        Body.setAngularVelocity(token, (Math.random() - 0.5) * 0.25);
        Body.setVelocity(token, { x: (Math.random() - 0.5) * 2.2 * DPR, y: (Math.random() - 0.5) * 1.2 * DPR });

        state.tokens.push(token);
      }
    });

    World.add(state.engine.world, state.tokens);
  };

  const resizeRenderer = () => {
    const W = Math.floor(state.glass.clientWidth || 0);
    const H = Math.floor(state.glass.clientHeight || 0);
    if (!W || !H) return;

    state.canvas.width = Math.floor(W * DPR);
    state.canvas.height = Math.floor(H * DPR);

    state.render.options.width = state.canvas.width;
    state.render.options.height = state.canvas.height;
    state.render.bounds.max.x = state.canvas.width;
    state.render.bounds.max.y = state.canvas.height;

    rebuildWalls();
    spawnTokens();
  };

  const bumpTokens = () => {
    state.tokens.forEach((t) => {
      const fx = (Math.random() - 0.5) * 0.012 * t.mass * DPR;
      const fy = (-Math.random() * 0.02) * t.mass * DPR;
      Body.applyForce(t, t.position, { x: fx, y: fy });
    });
  };

  const pokeTokens = (event) => {
    const rect = state.glass.getBoundingClientRect();
    const px = (event.clientX - rect.left) * DPR;
    const py = (event.clientY - rect.top) * DPR;

    state.tokens.forEach((body) => {
      const dx = body.position.x - px;
      const dy = body.position.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140 * DPR) {
        const strength = (1 - dist / (140 * DPR)) * 0.02 * body.mass * DPR;
        Body.applyForce(body, body.position, { x: (dx / (dist || 1)) * strength, y: (dy / (dist || 1)) * strength });
      }
    });
  };

  const init = ({ glassId = 'glassWindow', canvasId = 'vendingCanvas', rarities = {} } = {}) => {
    state.glass = document.getElementById(glassId);
    state.canvas = document.getElementById(canvasId);

    if (!state.glass || !state.canvas) {
      console.warn('Missing glass or canvas for VendingAnim');
      return;
    }

    state.rarities = { ...state.rarities, ...rarities };

    state.engine = Engine.create();
    state.engine.gravity.y = 1.05;
    state.render = Render.create({
      canvas: state.canvas,
      engine: state.engine,
      options: {
        width: 1,
        height: 1,
        wireframes: false,
        background: 'transparent',
        pixelRatio: 1
      }
    });
    state.runner = Runner.create();

    resizeRenderer();
    Render.run(state.render);
    Runner.run(state.runner, state.engine);

    let tick = 0;
    Events.on(state.engine, 'beforeUpdate', () => {
      tick++;
      if (tick % 60 === 0 && state.tokens.length) {
        const pick = state.tokens[Math.floor(Math.random() * state.tokens.length)];
        if (pick) {
          Body.applyForce(pick, pick.position, { x: (Math.random() - 0.5) * 0.01 * pick.mass * DPR, y: -0.012 * pick.mass * DPR });
        }
      }
    });

    state.glass.addEventListener('pointerdown', pokeTokens);
    window.addEventListener('resize', resizeRenderer);
  };

  const updateRarities = (rarities = {}) => {
    state.rarities = { ...state.rarities, ...rarities };
    spawnTokens();
  };

  window.VendingAnim = {
    init,
    bump: bumpTokens,
    updateRarities
  };
})();

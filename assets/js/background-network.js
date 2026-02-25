(() => {
  const canvas = document.getElementById('bgNetworkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const rand = (min, max) => min + Math.random() * (max - min);
  const dist = (a, b) => {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx*dx + dy*dy);
  };

  function resizeCanvasToViewport() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // Tweakables
  const NUM = 100;
  const CONNECT = 360;
  const nodes = [];

  function initNodes() {
    nodes.length = 0;
    for (let i = 0; i < NUM; i++) {
      nodes.push({
        x: rand(40, canvas.width - 40),
        y: rand(40, canvas.height - 40),
        vx: rand(-0.22, 0.22),
        vy: rand(-0.22, 0.22),
        r: rand(4.5, 7.5),
        pulse: rand(0, Math.PI * 2),
        pulseSpeed: rand(0.008, 0.017)
      });
    }
  }

  function pickNextTarget(fromIndex) {
    const from = nodes[fromIndex];
    let best = -1;
    let bestScore = Infinity;

    for (let k = 0; k < nodes.length; k++) {
      if (k === fromIndex) continue;
      const d = dist(from, nodes[k]);
      const score = (d < 360 ? d : d * 1.6) + rand(0, 40);
      if (score < bestScore) {
        bestScore = score;
        best = k;
      }
    }
    return best === -1 ? ((fromIndex + 1) % nodes.length) : best;
  }

  // Two walkers
  const WALKER_COUNT = 2;
  const walkers = [];

  function initWalkers() {
    walkers.length = 0;
    for (let k = 0; k < WALKER_COUNT; k++) {
      const i = Math.floor(Math.random() * nodes.length);
      walkers.push({
        i,
        j: pickNextTarget(i),
        t: rand(0, 1),
        speed: 0.008 + Math.random() * 0.006
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Move nodes
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 30 || n.x > canvas.width - 30) n.vx *= -1;
      if (n.y < 30 || n.y > canvas.height - 30) n.vy *= -1;

      n.pulse += n.pulseSpeed;
    }

    // Edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = dist(a, b);
        if (d < CONNECT) {
          const alpha = (1 - d / CONNECT) * 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(120, 200, 255, ${alpha})`;
          ctx.lineWidth = Math.max(1, alpha * 1.6);
          ctx.stroke();
        }
      }
    }

    // Nodes
    for (const n of nodes) {
      const pulse = Math.sin(n.pulse) * 0.4 + 0.6;

      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 7);
      g.addColorStop(0, `rgba(74,217,255,${0.14 * pulse})`);
      g.addColorStop(1, 'rgba(74,217,255,0)');
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 7, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(74,217,255,0.85)`;
      ctx.fill();
    }

    // Walkers
    walkers.forEach((w, index) => {
      w.t += w.speed;

      if (w.t >= 1) {
        w.t = 0;
        w.i = w.j;
        w.j = pickNextTarget(w.i);
      }

      const a = nodes[w.i];
      const b = nodes[w.j];

      const t = w.t;
      const tt = t * t * (3 - 2 * t); // smoothstep
      const x = a.x + (b.x - a.x) * tt;
      const y = a.y + (b.y - a.y) * tt;

      const hueShift = index === 0 ? 0 : 60;

      // Edge highlight
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = `rgba(${255 - hueShift}, 255, 255, 0.28)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glow
      const wg = ctx.createRadialGradient(x, y, 0, x, y, 40);
      wg.addColorStop(0, 'rgba(255,255,255,0.9)');
      wg.addColorStop(0.3, 'rgba(74,217,255,0.35)');
      wg.addColorStop(1, 'rgba(74,217,255,0)');
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fillStyle = wg;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fill();
    });

    if (!reduceMotion) requestAnimationFrame(draw);
  }

  function start() {
    resizeCanvasToViewport();
    initNodes();
    initWalkers();

    if (!reduceMotion) requestAnimationFrame(draw);
    else draw();
  }

  window.addEventListener('resize', start);
  start();
})();
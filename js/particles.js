/* ================================================================
   PARTÍCULAS — .editorial-break__particles
   Canvas 2D leve, sem WebGL, sem lib externa. Movimento senoidal
   simples (sem física real, sem ruído procedural), pausado fora da
   viewport e substituído por um frame estático em prefers-reduced-motion.
================================================================ */

(function () {
  const canvas = document.querySelector('.editorial-break__particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PARTICLE_COUNT = 40;
  const MAX_DPR = 1.5;

  let width = 0;
  let height = 0;
  let particles = [];
  let rafId = null;
  let running = false;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function createParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      baseX: rand(0, width),
      baseY: rand(0, height),
      amplitude: rand(8, 26),
      speed: rand(0.15, 0.4),
      phase: rand(0, Math.PI * 2),
      size: rand(1, 2.8),
    }));
  }

  function paint(getPos) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    particles.forEach((p) => {
      const { x, y } = getPos(p);
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawStatic() {
    paint((p) => ({ x: p.baseX, y: p.baseY }));
  }

  function drawFrame(time) {
    paint((p) => {
      const t = time * 0.001 * p.speed + p.phase;
      return {
        x: p.baseX + Math.cos(t) * p.amplitude,
        y: p.baseY + Math.sin(t) * p.amplitude,
      };
    });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createParticles();
    if (prefersReducedMotion) {
      drawStatic();
    } else {
      drawFrame(0);
    }
  }

  function loop(time) {
    drawFrame(time);
    rafId = requestAnimationFrame(loop);
  }

  function start() {
    if (running || prefersReducedMotion) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  resize();
  window.addEventListener('resize', resize);

  if (!prefersReducedMotion) {
    const section = canvas.closest('.editorial-break') || canvas;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          start();
        } else {
          stop();
        }
      });
    }, { threshold: 0.1 });
    observer.observe(section);
  }
})();

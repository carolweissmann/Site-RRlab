/* ================================================================
   PARTÍCULAS — .editorial-break__particles
   Canvas 2D leve, sem WebGL ou dependências externas. A rede se move
   suavemente, pausa fora da viewport e fica estática com reduced motion.
================================================================ */

(function () {
  const canvas = document.querySelector('.editorial-break__particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    const count = Math.round(Math.min(110, Math.max(55, (width * height) / 6500)));
    particles = Array.from({ length: count }, () => ({
      baseX: rand(0, width),
      baseY: rand(0, height),
      amplitude: rand(8, 24),
      speed: rand(0.15, 0.4),
      phase: rand(0, Math.PI * 2),
      size: rand(0.8, 1.6),
    }));
  }

  function paint(getPos) {
    ctx.clearRect(0, 0, width, height);
    const positions = particles.map((particle) => getPos(particle));
    const connectionDistance = Math.min(150, Math.max(110, width * 0.12));

    ctx.lineWidth = 0.6;
    for (let i = 0; i < positions.length; i += 1) {
      for (let j = i + 1; j < positions.length; j += 1) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const distance = Math.hypot(dx, dy);
        if (distance < connectionDistance) {
          const opacity = (1 - distance / connectionDistance) * 0.2;
          ctx.strokeStyle = `rgba(185, 139, 125, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(positions[i].x, positions[i].y);
          ctx.lineTo(positions[j].x, positions[j].y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = 'rgba(196, 154, 140, 0.55)';
    ctx.shadowColor = 'rgba(196, 154, 140, 0.35)';
    ctx.shadowBlur = 4;
    particles.forEach((particle, index) => {
      const { x, y } = positions[index];
      ctx.beginPath();
      ctx.arc(x, y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
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

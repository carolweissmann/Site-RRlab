/* ================================================================
   RRlab — Restless Research Lab
   main.js — v3

   SUMÁRIO
   1.  Canvas de Partículas Biomédicas
   2.  Navbar — estado de scroll
   3.  Mobile Nav
   4.  Scroll Reveal (IntersectionObserver)
   5.  Hero — disparo imediato de reveals
   6.  Smooth Scroll com offset do nav
   7.  Counters animados
================================================================ */


/* ================================================================
   1. CANVAS DE PARTÍCULAS BIOMÉDICAS
   Simula: nós de rede (células/moléculas), conexões dinâmicas,
   cores da paleta oficial (#1e6882, #9f766a, #e5e3e2)
================================================================ */

(function initParticles() {

  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  /* ── Parâmetros ─────────────────────────────────────────────── */
  const CONFIG = {
    count:          90,          /* número de partículas */
    connectionDist: 160,         /* distância máx. para ligar nós */
    speedMin:       0.12,
    speedMax:       0.38,
    radiusMin:      1.2,
    radiusMax:      3.8,
    /* Cores da marca */
    colors: [
      'rgba(30, 104, 130, ALPHA)',   /* #1e6882 azul */
      'rgba(30, 104, 130, ALPHA)',   /* azul (peso duplo) */
      'rgba(159, 118, 106, ALPHA)',  /* #9f766a terracota */
      'rgba(229, 227, 226, ALPHA)',  /* #e5e3e2 cinza claro */
    ],
  };

  /* ── Partícula ──────────────────────────────────────────────── */
  class Particle {
    constructor(w, h) {
      this.reset(w, h, true);
    }

    reset(w, h, randomY = false) {
      this.x  = Math.random() * w;
      this.y  = randomY ? Math.random() * h : h + 10;
      this.vx = (Math.random() - 0.5) * (CONFIG.speedMax - CONFIG.speedMin) + CONFIG.speedMin * Math.sign(Math.random() - 0.5);
      this.vy = -(Math.random() * (CONFIG.speedMax - CONFIG.speedMin) + CONFIG.speedMin);
      this.r  = Math.random() * (CONFIG.radiusMax - CONFIG.radiusMin) + CONFIG.radiusMin;
      /* Pega cor aleatória da paleta */
      const raw   = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      const alpha = (0.25 + Math.random() * 0.55).toFixed(2);
      this.color  = raw.replace('ALPHA', alpha);
      this.connColor = raw.replace('ALPHA', '0.12');
    }

    update(w, h) {
      this.x += this.vx;
      this.y += this.vy;
      /* Rebote lateral */
      if (this.x < 0 || this.x > w) this.vx *= -1;
      /* Reinicia partícula que saiu pelo topo */
      if (this.y < -10) this.reset(w, h);
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  /* ── Estado ─────────────────────────────────────────────────── */
  let particles = [];
  let W = 0, H = 0;
  let animId = null;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function init() {
    resize();
    particles = Array.from({ length: CONFIG.count }, () => new Particle(W, H));
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a  = particles[i];
        const b  = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.connectionDist) {
          const opacity = (1 - dist / CONFIG.connectionDist) * 0.18;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(30, 104, 130, ${opacity.toFixed(3)})`;
          ctx.lineWidth   = 0.8;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    // Mantém apenas os pontos em movimento: as conexões deixavam o fundo
    // visualmente carregado, especialmente próximo aos indicadores da hero.
    particles.forEach(p => { p.update(W, H); p.draw(ctx); });
    animId = requestAnimationFrame(loop);
  }

  /* ── Inicialização ──────────────────────────────────────────── */
  init();
  loop();

  /* ── Responsivo ─────────────────────────────────────────────── */
  window.addEventListener('resize', () => {
    resize();
    /* Reposiciona partículas que ficaram fora dos novos limites */
    particles.forEach(p => {
      if (p.x > W) p.x = W;
      if (p.y > H) p.y = H;
    });
  }, { passive: true });

  /* ── Pausa quando aba fica invisível (performance) ──────────── */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      loop();
    }
  });

})();


/* ================================================================
   2. NAVBAR — estado de scroll
================================================================ */

const mainNav = document.getElementById('mainNav');

window.addEventListener('scroll', () => {
  mainNav.classList.toggle('scrolled', window.scrollY > 28);
}, { passive: true });


/* ================================================================
   3. MOBILE NAV
================================================================ */

const mobileNav   = document.getElementById('mobileNav');
const hamburger   = document.getElementById('navHamburger');
const mobileClose = document.getElementById('mobileNavClose');

function openMobileNav() {
  mobileNav.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMobileNav() {
  mobileNav.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', openMobileNav);
mobileClose.addEventListener('click', closeMobileNav);

/* Fecha com ESC */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMobileNav();
});

/* Fecha ao clicar num link do menu */
mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMobileNav);
});


/* ================================================================
   4. SCROLL REVEAL (IntersectionObserver)
================================================================ */

const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold:  0.10,
  rootMargin: '0px 0px -50px 0px',
});

revealEls.forEach(el => revealObserver.observe(el));


/* ================================================================
   5. HERO — disparo imediato (above the fold)
================================================================ */

document.querySelectorAll('.hero .reveal').forEach((el, i) => {
  setTimeout(() => el.classList.add('visible'), 80 + i * 110);
});


/* ================================================================
   6. SMOOTH SCROLL com offset do nav
================================================================ */

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const sel = link.getAttribute('href');
    if (sel === '#') return;
    const target = document.querySelector(sel);
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const top    = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});


/* ================================================================
   7. COUNTERS ANIMADOS
   Uso: <span data-counter="300" data-suffix="+">300+</span>
================================================================ */

function animateCounter(el, target, suffix, duration = 1400) {
  const start = performance.now();

  function tick(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    /* Ease-out cúbico */
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const counterEls = document.querySelectorAll('[data-counter]');

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.done) {
      entry.target.dataset.done = 'true';
      animateCounter(
        entry.target,
        parseInt(entry.target.dataset.counter, 10),
        entry.target.dataset.suffix || '',
      );
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

counterEls.forEach(el => counterObserver.observe(el));

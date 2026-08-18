/* ================================================================
   RRlab — Restless Research Lab
   main.js — v5

   SUMÁRIO
   0.  Fundo animado — iridescence (WebGL)
   1.  Hero — campo de partículas (canvas 2D, estático)
   2.  Navbar — estado de scroll
   3.  Mobile Nav
   4.  Scroll Reveal (IntersectionObserver)
   5.  Hero — disparo imediato de reveals
   6.  Smooth Scroll com offset do nav
   7.  Counters animados
================================================================ */


/* ================================================================
   0. FUNDO ANIMADO — IRIDESCENCE (WebGL)
   Camada fixa atrás de todo o conteúdo. Engine em js/iridescence.js.
================================================================ */

(function initNebulaBackground() {
  const bg = document.getElementById('iridescence-bg');
  if (!bg || typeof createNebula !== 'function') return;

  createNebula(bg, {
    colorDeep: [0.027, 0.035, 0.047],
    colorMid:  [0.118, 0.408, 0.510],
    colorGlow: [0.624, 0.463, 0.416],
    speed: 0.8,
    mouseReact: true,
    stars: true,
  });
})();


/* ================================================================
   1. HERO — CAMPO DE PARTÍCULAS
   Canvas 2D nativo, sem lib externa. Posições geradas uma única vez
   (não há loop de animação); só a camada inteira se desloca num
   parallax sutil ao mover o mouse.
================================================================ */

(function initHeroParticles() {

  const hero   = document.querySelector('.hero');
  const canvas = document.getElementById('hero-particles');
  if (!hero || !canvas) return;

  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Paleta da marca — azul predominante, terracota como acento raro */
  function pickColor() {
    const r = Math.random();
    if (r < 0.15) return '159, 118, 106';  /* terracota */
    if (r < 0.55) return '91, 184, 212';   /* azul claro */
    return '30, 104, 130';                 /* azul marca */
  }

  let particles = [];

  function render() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = hero.clientWidth;
    const h = hero.clientHeight;

    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = w / 2;
    const cy = h / 2;
    const maxDist = Math.hypot(cx, cy);

    /* Densidade proporcional à área, com teto pra não pesar em telas grandes */
    const count = Math.max(40, Math.min(140, Math.round((w * h) / 9000)));

    particles = Array.from({ length: count }, () => {
      const x = Math.random() * w;
      const y = Math.random() * h;
      /* 0 no centro, 1 na borda — usado pra dar mais brilho/tamanho ao centro */
      const dist  = Math.hypot(x - cx, y - cy) / maxDist;
      const boost = Math.max(1 - dist * 0.75, 0.35);
      return {
        x, y,
        radius: (0.6 + Math.random() * 1.2) * boost,
        alpha:  (0.15 + Math.random() * 0.4) * Math.max(boost, 0.4),
        color:  pickColor(),
      };
    });

    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      ctx.fill();
    });
  }

  render();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 200);
  }, { passive: true });

  /* Parallax sutil no mouse — só desloca a camada via CSS, não redesenha */
  if (!prefersReducedMotion) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width  - 0.5;
      const ny = (e.clientY - rect.top)  / rect.height - 0.5;
      canvas.style.transform = `translate(${nx * -10}px, ${ny * -10}px)`;
    }, { passive: true });

    hero.addEventListener('mouseleave', () => {
      canvas.style.transform = 'translate(0, 0)';
    });
  }

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
let lastFocusedElement = null;

function isMobileNavOpen() {
  return mobileNav.classList.contains('open');
}

function openMobileNav() {
  if (isMobileNavOpen()) return;
  lastFocusedElement = document.activeElement;
  mobileNav.classList.add('open');
  mobileNav.removeAttribute('inert');
  mobileNav.setAttribute('aria-hidden', 'false');
  hamburger.setAttribute('aria-expanded', 'true');
  document.body.classList.add('mobile-nav-open');
  requestAnimationFrame(() => mobileClose.focus());
}

function closeMobileNav() {
  if (!isMobileNavOpen()) return;
  mobileNav.classList.remove('open');
  mobileNav.setAttribute('inert', '');
  mobileNav.setAttribute('aria-hidden', 'true');
  hamburger.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('mobile-nav-open');
  if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

hamburger.addEventListener('click', openMobileNav);
mobileClose.addEventListener('click', closeMobileNav);

/* Fecha com ESC */
document.addEventListener('keydown', e => {
  if (!isMobileNavOpen()) return;

  if (e.key === 'Escape') {
    closeMobileNav();
    return;
  }

  if (e.key === 'Tab') {
    const focusable = mobileNav.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

/* Fecha ao clicar num link do menu */
mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMobileNav);
});

/* Tocar fora do painel também fecha o menu. */
mobileNav.addEventListener('click', event => {
  if (event.target === mobileNav) closeMobileNav();
});

/* Fecha o painel e remove o bloqueio de rolagem ao voltar ao desktop. */
window.addEventListener('resize', () => {
  if (window.innerWidth > 1100) closeMobileNav();
}, { passive: true });


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
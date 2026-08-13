/* ================================================================
   RRlab — Restless Research Lab
   main.js — v4

   SUMÁRIO
   1.  Navbar — estado de scroll
   2.  Mobile Nav
   3.  Scroll Reveal (IntersectionObserver)
   4.  Hero — disparo imediato de reveals
   5.  Smooth Scroll com offset do nav
   6.  Counters animados
================================================================ */


/* ================================================================
   1. NAVBAR — estado de scroll
================================================================ */

const mainNav = document.getElementById('mainNav');

window.addEventListener('scroll', () => {
  mainNav.classList.toggle('scrolled', window.scrollY > 28);
}, { passive: true });


/* ================================================================
   2. MOBILE NAV
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
   3. SCROLL REVEAL (IntersectionObserver)
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
   4. HERO — disparo imediato (above the fold)
================================================================ */

document.querySelectorAll('.hero .reveal').forEach((el, i) => {
  setTimeout(() => el.classList.add('visible'), 80 + i * 110);
});


/* ================================================================
   5. SMOOTH SCROLL com offset do nav
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
   6. COUNTERS ANIMADOS
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
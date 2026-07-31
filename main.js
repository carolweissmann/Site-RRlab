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
   1. MOLÉCULA 3D — fundo hero animado (Three.js WebGL)
   Estrutura tipo aspirina girando sobre fundo preto,
   cores da paleta oficial #1e6882
================================================================ */

(function initMolecule() {

  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  /* Carrega Three.js dinamicamente e só então monta a cena */
  const script  = document.createElement('script');
  script.src    = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  script.onload = buildScene;
  document.head.appendChild(script);

  function buildScene() {

    /* ── Renderer ─────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);

    /* ── Cena e câmera ────────────────────────────────────────── */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 20);

    /* ── Luzes ────────────────────────────────────────────────── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    const keyLight = new THREE.PointLight(0x1e6882, 5, 50);
    keyLight.position.set(6, 8, 10);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x5bb8d4, 3, 40);
    fillLight.position.set(-10, -4, 6);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, 10, -5);
    scene.add(rimLight);

    /* ── Materiais ────────────────────────────────────────────── */
    function atomMat(hex, emissiveInt) {
      return new THREE.MeshPhongMaterial({
        color:            hex,
        emissive:         hex,
        emissiveIntensity: emissiveInt || 0.12,
        shininess:        100,
        specular:         new THREE.Color(0xaaddee),
      });
    }

    const MAT = {
      C: atomMat(0x1e6882, 0.12),   /* carbono  — azul marca */
      N: atomMat(0x3a9bbf, 0.18),   /* nitrogênio — azul claro */
      O: atomMat(0x8dd8ec, 0.22),   /* oxigênio — azul muito claro */
      H: atomMat(0x0d4559, 0.08),   /* hidrogênio — azul escuro */
    };

    const bondMat = new THREE.MeshPhongMaterial({
      color:             0x1a5a70,
      emissive:          0x0a2d3a,
      emissiveIntensity: 0.25,
      shininess:         60,
      transparent:       true,
      opacity:           0.80,
    });

    /* ── Estrutura da molécula (aspirina simplificada) ────────── */
    const ATOMS = [
      /* anel benzênico */
      { p: [ 0.00,  1.40,  0.00], r: 0.45, t: 'C' },
      { p: [ 1.21,  0.70,  0.00], r: 0.45, t: 'C' },
      { p: [ 1.21, -0.70,  0.00], r: 0.45, t: 'C' },
      { p: [ 0.00, -1.40,  0.00], r: 0.45, t: 'C' },
      { p: [-1.21, -0.70,  0.00], r: 0.45, t: 'C' },
      { p: [-1.21,  0.70,  0.00], r: 0.45, t: 'C' },
      /* cadeia éster -O-C(=O)-CH3 */
      { p: [ 0.00,  2.85,  0.00], r: 0.40, t: 'O' },
      { p: [ 0.00,  4.20,  0.65], r: 0.43, t: 'C' },
      { p: [-1.15,  4.95,  0.55], r: 0.37, t: 'O' },
      { p: [ 1.15,  4.95,  1.30], r: 0.43, t: 'C' },
      { p: [ 1.05,  6.35,  1.25], r: 0.28, t: 'H' },
      { p: [ 2.20,  4.65,  0.90], r: 0.28, t: 'H' },
      { p: [ 1.15,  4.55,  2.60], r: 0.28, t: 'H' },
      /* cadeia ácido -C(=O)-OH */
      { p: [ 2.45, -1.40,  0.00], r: 0.40, t: 'C' },
      { p: [ 3.35, -0.60,  0.55], r: 0.37, t: 'O' },
      { p: [ 2.75, -2.75,  0.00], r: 0.37, t: 'O' },
      { p: [ 3.95, -2.95,  0.10], r: 0.28, t: 'H' },
      /* H no anel */
      { p: [-2.42,  1.40,  0.00], r: 0.28, t: 'H' },
      { p: [-2.42, -1.40,  0.00], r: 0.28, t: 'H' },
      { p: [ 0.00, -2.85,  0.00], r: 0.28, t: 'H' },
    ];

    const BONDS = [
      /* anel */
      [0,1],[1,2],[2,3],[3,4],[4,5],[5,0],
      /* éster */
      [0,6],[6,7],[7,8],[7,9],[9,10],[9,11],[9,12],
      /* ácido */
      [2,13],[13,14],[13,15],[15,16],
      /* H no anel */
      [5,17],[4,18],[3,19],
    ];

    /* ── Grupo da molécula ────────────────────────────────────── */
    const mol = new THREE.Group();

    /* Átomos */
    ATOMS.forEach(a => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(a.r, 32, 32),
        MAT[a.t],
      );
      mesh.position.set(...a.p);
      mol.add(mesh);
    });

    /* Ligações (cilindros) */
    BONDS.forEach(([i, j]) => {
      const v1  = new THREE.Vector3(...ATOMS[i].p);
      const v2  = new THREE.Vector3(...ATOMS[j].p);
      const dir = new THREE.Vector3().subVectors(v2, v1);
      const len = dir.length();
      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);

      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, len, 14, 1),
        bondMat,
      );
      mesh.position.copy(mid);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize(),
      );
      mol.add(mesh);
    });

    /* Centraliza e posiciona ligeiramente à direita */
    const box = new THREE.Box3().setFromObject(mol);
    mol.position.sub(box.getCenter(new THREE.Vector3()));
    mol.position.x += 1.5;

    scene.add(mol);

    /* ── Resize ───────────────────────────────────────────────── */
    function resize() {
      const w = canvas.offsetWidth  || window.innerWidth;
      const h = canvas.offsetHeight || window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    /* ── Loop de animação ─────────────────────────────────────── */
    let t = 0;
    let animId;

    function loop() {
      t += 0.007;
      mol.rotation.y = t;
      mol.rotation.x = Math.sin(t * 0.28) * 0.28;
      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    }

    loop();

    /* Pausa quando aba fica invisível (performance) */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        loop();
      }
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
const HIMAWARI_KEYS = {
  announcements: 'himawari_announcements',
  tournaments: 'himawari_tournaments',
  bracket: 'himawari_bracket',
  auth: 'himawari_admin_session',
};

const SEED_ANNOUNCEMENTS = [
  { id: 'a1', title: 'Scrim block vs Nightshade opens Friday', body: 'Signups open in #scrims. Bo3, 6v6 SnD/Hardpoint/Control rotation.', date: '2026-08-22' },
  { id: 'a2', title: 'Roster update: welcome Petal to the starting six', body: 'Petal moves up from academy after a strong tryout series.', date: '2026-08-14' },
];

const SEED_TOURNAMENTS = [
  { id: 't1', name: 'Sunflower Open — August', format: 'Single elimination', date: '2026-08-30', status: 'Upcoming' },
  { id: 't2', name: 'Community Cup #4', format: 'Round robin', date: '2026-07-19', status: 'Completed — Himawari placed 2nd' },
];

function himawariGet(key, seed) {
  const raw = localStorage.getItem(key);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {}
  }
  if (seed) localStorage.setItem(key, JSON.stringify(seed));
  return seed || [];
}

function himawariSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }
  const here = document.body.dataset.page;
  document.querySelectorAll('.nav-links a').forEach((a) => {
    if (a.dataset.page === here) a.setAttribute('aria-current', 'page');
  });
}

function buildEmblem(el, petalCount = 12) {
  el.innerHTML = '';
  for (let i = 0; i < petalCount; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    const rot = (360 / petalCount) * i;
    petal.style.setProperty('--rot', `${rot}deg`);
    petal.style.transform = `rotate(${rot}deg)`;
    petal.style.animationDelay = `${i * 45}ms`;
    el.appendChild(petal);
  }
  if (el.classList.contains('emblem-hero')) {
    const core = document.createElement('div');
    core.className = 'core';
    el.appendChild(core);
  }
}

function initReveal() {
  const groups = new Map();
  const dirs = ['up', 'left', 'right', 'scale'];
  const targets = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window) || targets.length === 0) {
    // No animation support (or nothing to animate) — leave elements in
    // their default, fully-visible state. Nothing to do.
    return;
  }

  targets.forEach((t) => {
    const parent = t.parentElement;
    const idx = groups.get(parent) || 0;
    groups.set(parent, idx + 1);
    if (!t.dataset.dir) t.dataset.dir = dirs[idx % dirs.length];
    t.style.transitionDelay = `${Math.min(idx * 70, 420)}ms`;
    // Only now, with everything configured, opt this element into the
    // hidden/animated starting state.
    t.classList.add('reveal-armed');
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  targets.forEach((t) => io.observe(t));

  // Safety net: if an armed element never registers as intersecting
  // (edge cases with certain layouts, extensions, or nested scroll
  // containers), don't let it stay invisible forever.
  setTimeout(() => {
    targets.forEach((t) => t.classList.add('is-visible'));
  }, 1200);
}

function initHeroMotion() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const glow2 = document.createElement('div');
  glow2.className = 'hero-glow-2';
  hero.appendChild(glow2);

  if (!reduceMotion) {
    const field = document.createElement('div');
    field.className = 'pollen-field';
    field.setAttribute('aria-hidden', 'true');
    const count = 18;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pollen';
      const left = Math.random() * 100;
      const duration = 7 + Math.random() * 6;
      const delay = Math.random() * 8;
      const driftX = (Math.random() * 80 - 40).toFixed(0) + 'px';
      p.style.left = `${left}%`;
      p.style.setProperty('--drift-x', driftX);
      p.style.animationDuration = `${duration}s`;
      p.style.animationDelay = `${delay}s`;
      field.appendChild(p);
    }
    hero.appendChild(field);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        hero.style.setProperty('--parallax', `${y * 0.25}px`);
        ticking = false;
      });
    }, { passive: true });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  document.querySelectorAll('.emblem, .emblem-hero').forEach((el) => buildEmblem(el));
  initReveal();
  initHeroMotion();
});

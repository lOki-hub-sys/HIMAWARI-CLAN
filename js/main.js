/* ============================================================
   Himawari — shared site behavior
   Data layer: localStorage (simple single-admin site, no server
   needed — see SKILL.md admin panel section for the reasoning).
   ============================================================ */

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
    try { return JSON.parse(raw); } catch (e) { /* fall through to seed */ }
  }
  if (seed) localStorage.setItem(key, JSON.stringify(seed));
  return seed || [];
}

function himawariSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- Nav ---------- */
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

/* ---------- Sunflower emblem builder ---------- */
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

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || targets.length === 0) {
    targets.forEach((t) => t.classList.add('is-visible'));
    return;
  }
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
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  document.querySelectorAll('.emblem, .emblem-hero').forEach((el) => buildEmblem(el));
  initReveal();
});

const HIMAWARI_KEYS = {
  bracket: 'himawari_bracket',
  auth: 'himawari_admin_session',
};

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

/* ---------- Shared-data API helpers (D1-backed, replaces localStorage) ---------- */
// table: 'roster' | 'announcements' | 'tournaments' | 'applicants' | 'matches' | 'bracket'

async function apiList(table) {
  const res = await fetch(`/api/${table}`);
  if (!res.ok) throw new Error(`Failed to load ${table}`);
  return res.json();
}

async function apiSave(table, record) {
  const res = await fetch(`/api/${table}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`Failed to save ${table}`);
  return res.json();
}

async function apiDelete(table, id) {
  const res = await fetch(`/api/${table}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete from ${table}`);
  return res.json();
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
    return;
  }

  targets.forEach((t) => {
    const parent = t.parentElement;
    const idx = groups.get(parent) || 0;
    groups.set(parent, idx + 1);
    if (!t.dataset.dir) t.dataset.dir = dirs[idx % dirs.length];
    t.style.transitionDelay = `${Math.min(idx * 70, 420)}ms`;
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

function initFooterLinks() {
  const footer = document.querySelector('.site-footer');
  if (!footer) return;
  const links = document.createElement('div');
  links.className = 'footer-links';
  links.innerHTML = `
    <a href="https://discord.gg/YOUR_INVITE" target="_blank" rel="noopener" aria-label="Discord">Discord</a>
    <a href="https://twitch.tv/YOUR_CLAN" target="_blank" rel="noopener" aria-label="Twitch">Twitch</a>
    <a href="https://youtube.com/YOUR_CLAN" target="_blank" rel="noopener" aria-label="YouTube">YouTube</a>
    <a href="https://x.com/YOUR_CLAN" target="_blank" rel="noopener" aria-label="X">X</a>
  `;
  footer.appendChild(links);
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  document.querySelectorAll('.emblem, .emblem-hero').forEach((el) => buildEmblem(el));
  initReveal();
  initHeroMotion();
  initFooterLinks();
});
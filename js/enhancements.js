/**
 * HIMAWARI — Enhancements Module
 * Pure additions: Boot sequence, Hero cursor glow, Scramble-reveal stats, 
 * 3D Card Tilt, Magnetic buttons, and Admin tab flicker.
 */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  /* 1. Boot Sequence Overlay */
  function initBootSequence() {
    const isHomepage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');
    const hasBooted = sessionStorage.getItem('himawari_booted');

    if (!isHomepage || hasBooted || prefersReducedMotion) return;

    const overlay = document.createElement('div');
    overlay.className = 'boot-overlay';
    overlay.innerHTML = `
      <div class="boot-mark"></div>
      <div class="boot-lines" id="boot-lines"></div>
      <div class="boot-bar-track">
        <div class="boot-bar-fill"></div>
      </div>
    `;
    document.body.appendChild(overlay);

    const linesContainer = document.getElementById('boot-lines');
    const logs = [
      'HIMAWARI OPS // INITIALIZING',
      'LOADING SQUAD DATA',
      'STANDBY'
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        linesContainer.innerHTML = `<div class="boot-line">${log}</div>`;
      }, index * 400);
    });

    setTimeout(() => {
      overlay.classList.add('hide');
      sessionStorage.setItem('himawari_booted', 'true');
      setTimeout(() => overlay.remove(), 500);
    }, 1500);
  }

  /* 2. Hero Cursor Glow */
  function initHeroGlow() {
    const hero = document.querySelector('.hero');
    const glow = document.querySelector('.hero-cursor-glow');

    if (!hero || !glow) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      glow.style.setProperty('--mx', `${x}%`);
      glow.style.setProperty('--my', `${y}%`);
    });
  }

  /* 3. Text Scramble Reveal for Stats */
  function initScrambleStats() {
    const targets = document.querySelectorAll('.scramble-target, .stat-number, .stat-value');
    if (targets.length === 0) return;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@$';

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          scrambleElement(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    targets.forEach(el => observer.observe(el));

    function scrambleElement(el) {
      const originalText = el.textContent.trim();
      let iteration = 0;
      const maxIterations = 12;

      const interval = setInterval(() => {
        el.textContent = originalText
          .split('')
          .map((char, index) => {
            if (char === ' ' || char === '–' || char === '-') return char;
            if (index < (iteration / maxIterations) * originalText.length) {
              return originalText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('');

        iteration++;

        if (iteration >= maxIterations) {
          el.textContent = originalText;
          clearInterval(interval);
        }
      }, 35);
    }
  }

  /* 4. Interactive Motion (3D Tilt & Magnetic Buttons) */
  function initInteractiveMotion() {
    if (prefersReducedMotion || isTouchDevice) return;

    // 3D Card Tilt — targets the site's actual HUD-panel classes
    // (previously targeted classes that don't exist in the markup,
    // so the effect never ran; this wires it up for real).
    const cards = document.querySelectorAll('.card, .stat, .gallery-tile, .match, .login-box');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;

        card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.012)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });

    // Magnetic Buttons
    const buttons = document.querySelectorAll('.btn, .btn-gold, .btn-primary, .btn-ghost');
    buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  /* 4b. Cursor-tracking scan glow on HUD panels (mirrors the hero glow,
     applied per-panel via CSS custom properties — purely additive). */
  function initPanelScan() {
    if (prefersReducedMotion || isTouchDevice) return;
    const panels = document.querySelectorAll('.card, .stat, .gallery-tile, .match');
    panels.forEach(panel => {
      panel.addEventListener('mousemove', (e) => {
        const rect = panel.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        panel.style.setProperty('--px', `${x}%`);
        panel.style.setProperty('--py', `${y}%`);
      });
    });
  }

  /* 5. Admin Tab Switch Flicker */
  function initAdminTabFlicker() {
    const tabButtons = document.querySelectorAll('[data-tab], .admin-tab-btn, .tab-btn');
    const tabContents = document.querySelectorAll('.admin-tab-content, .tab-content, #admin-app');

    if (tabButtons.length === 0) return;

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabContents.forEach(content => {
          content.classList.remove('tab-flicker');
          void content.offsetWidth; // Reflow to restart animation
          content.classList.add('tab-flicker');
        });
      });
    });
  }

  // Run modules
  initBootSequence();
  initHeroGlow();
  initScrambleStats();
  initInteractiveMotion();
  initPanelScan();
  initAdminTabFlicker();
});

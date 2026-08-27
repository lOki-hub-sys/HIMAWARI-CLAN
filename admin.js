/* ============================================================
   Himawari admin panel
   NOTE ON AUTH: this is a client-only demo so there's no server
   to hold real secrets. It hashes the password (SHA-256) rather
   than comparing plaintext, and issues an expiring session token
   in sessionStorage instead of a permanent flag — closer in spirit
   to "real" auth than a single shared password, but still not a
   substitute for server-verified per-admin accounts. Swap in a
   real backend (see SKILL.md) before this guards anything that
   actually matters.
   ============================================================ */

const ADMIN_CREDS = {
  username: 'admin',
  // sha256("himawari2026") — change this before real use
  passHash: '785cf14bfc9318270ec5f8dc9613482315ff504acff216f8475cc3c941d7c33d',
};
const SESSION_TTL_MS = 1000 * 60 * 60; // 1 hour

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getSession() {
  try {
    const raw = sessionStorage.getItem(HIMAWARI_KEYS.auth);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (Date.now() > s.expires) { sessionStorage.removeItem(HIMAWARI_KEYS.auth); return null; }
    return s;
  } catch (e) { return null; }
}

function setSession() {
  sessionStorage.setItem(HIMAWARI_KEYS.auth, JSON.stringify({ expires: Date.now() + SESSION_TTL_MS }));
}

function showAdmin() {
  document.getElementById('login-gate').style.display = 'none';
  document.getElementById('admin-app').style.display = 'block';
  renderAnnouncements();
  renderTournaments();
}

function showLogin() {
  document.getElementById('admin-app').style.display = 'none';
  document.getElementById('login-gate').style.display = 'flex';
}

document.getElementById('login-btn').addEventListener('click', async () => {
  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value;
  const hash = await sha256(pass);
  if (user === ADMIN_CREDS.username && hash === ADMIN_CREDS.passHash) {
    setSession();
    showAdmin();
  } else {
    document.getElementById('login-error').textContent = 'Incorrect username or password.';
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  sessionStorage.removeItem(HIMAWARI_KEYS.auth);
  showLogin();
});

if (getSession()) showAdmin(); else showLogin();

/* ---------- Tabs ---------- */
document.querySelectorAll('.admin-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
  });
});

/* ---------- Announcements CRUD ---------- */
function renderAnnouncements() {
  const items = himawariGet(HIMAWARI_KEYS.announcements, SEED_ANNOUNCEMENTS);
  const list = document.getElementById('announce-list');
  list.innerHTML = items.map(a => `
    <div class="list-row">
      <div>
        <strong>${a.title}</strong><br>
        <span style="color:var(--text-dim);font-size:0.9rem;">${a.body}</span><br>
        <time style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-dim);">${a.date}</time>
      </div>
      <div class="row-actions">
        <button data-edit="${a.id}">Edit</button>
        <button data-delete="${a.id}">Delete</button>
      </div>
    </div>
  `).join('') || '<p style="color:var(--text-dim);">No announcements yet.</p>';

  list.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => editAnnouncement(btn.dataset.edit)));
  list.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteAnnouncement(btn.dataset.delete)));
}

function editAnnouncement(id) {
  const items = himawariGet(HIMAWARI_KEYS.announcements, SEED_ANNOUNCEMENTS);
  const a = items.find(i => i.id === id);
  if (!a) return;
  document.getElementById('announce-id').value = a.id;
  document.getElementById('announce-title').value = a.title;
  document.getElementById('announce-date').value = a.date;
  document.getElementById('announce-body').value = a.body;
  document.getElementById('announce-cancel').style.display = 'inline-flex';
}

function deleteAnnouncement(id) {
  const items = himawariGet(HIMAWARI_KEYS.announcements, SEED_ANNOUNCEMENTS).filter(i => i.id !== id);
  himawariSet(HIMAWARI_KEYS.announcements, items);
  renderAnnouncements();
}

document.getElementById('announce-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('announce-id').value;
  const items = himawariGet(HIMAWARI_KEYS.announcements, SEED_ANNOUNCEMENTS);
  const record = {
    id: id || 'a' + Date.now(),
    title: document.getElementById('announce-title').value,
    body: document.getElementById('announce-body').value,
    date: document.getElementById('announce-date').value,
  };
  const idx = items.findIndex(i => i.id === id);
  if (idx > -1) items[idx] = record; else items.unshift(record);
  himawariSet(HIMAWARI_KEYS.announcements, items);
  e.target.reset();
  document.getElementById('announce-id').value = '';
  document.getElementById('announce-cancel').style.display = 'none';
  renderAnnouncements();
});

document.getElementById('announce-cancel').addEventListener('click', () => {
  document.getElementById('announce-form').reset();
  document.getElementById('announce-id').value = '';
  document.getElementById('announce-cancel').style.display = 'none';
});

/* ---------- Tournaments CRUD ---------- */
function renderTournaments() {
  const items = himawariGet(HIMAWARI_KEYS.tournaments, SEED_TOURNAMENTS);
  const list = document.getElementById('tourney-list');
  list.innerHTML = items.map(t => `
    <div class="list-row">
      <div>
        <strong>${t.name}</strong><br>
        <span style="color:var(--text-dim);font-size:0.9rem;">${t.format} · ${t.date}</span><br>
        <span style="font-family:var(--font-mono);font-size:0.75rem;color:var(--gold);">${t.status}</span>
      </div>
      <div class="row-actions">
        <button data-edit="${t.id}">Edit</button>
        <button data-delete="${t.id}">Delete</button>
      </div>
    </div>
  `).join('') || '<p style="color:var(--text-dim);">No tournaments yet.</p>';

  list.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => editTourney(btn.dataset.edit)));
  list.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteTourney(btn.dataset.delete)));
}

function editTourney(id) {
  const items = himawariGet(HIMAWARI_KEYS.tournaments, SEED_TOURNAMENTS);
  const t = items.find(i => i.id === id);
  if (!t) return;
  document.getElementById('tourney-id').value = t.id;
  document.getElementById('tourney-name').value = t.name;
  document.getElementById('tourney-date').value = t.date;
  document.getElementById('tourney-format').value = t.format;
  document.getElementById('tourney-status').value = t.status;
  document.getElementById('tourney-cancel').style.display = 'inline-flex';
}

function deleteTourney(id) {
  const items = himawariGet(HIMAWARI_KEYS.tournaments, SEED_TOURNAMENTS).filter(i => i.id !== id);
  himawariSet(HIMAWARI_KEYS.tournaments, items);
  renderTournaments();
}

document.getElementById('tourney-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('tourney-id').value;
  const items = himawariGet(HIMAWARI_KEYS.tournaments, SEED_TOURNAMENTS);
  const record = {
    id: id || 't' + Date.now(),
    name: document.getElementById('tourney-name').value,
    date: document.getElementById('tourney-date').value,
    format: document.getElementById('tourney-format').value,
    status: document.getElementById('tourney-status').value || 'Upcoming',
  };
  const idx = items.findIndex(i => i.id === id);
  if (idx > -1) items[idx] = record; else items.unshift(record);
  himawariSet(HIMAWARI_KEYS.tournaments, items);
  e.target.reset();
  document.getElementById('tourney-id').value = '';
  document.getElementById('tourney-cancel').style.display = 'none';
  renderTournaments();
});

document.getElementById('tourney-cancel').addEventListener('click', () => {
  document.getElementById('tourney-form').reset();
  document.getElementById('tourney-id').value = '';
  document.getElementById('tourney-cancel').style.display = 'none';
});

/* ---------- Bracket generator ---------- */
function suggestFormat(n) {
  if (n <= 5) return 'single';
  if (n <= 12) return 'double';
  return 'round-robin';
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSingleElim(teams) {
  let size = 2;
  while (size < teams.length) size *= 2;
  const padded = [...teams];
  while (padded.length < size) padded.push('BYE');
  const rounds = [];
  let current = padded;
  let roundNum = 1;
  while (current.length > 1) {
    const matches = [];
    for (let i = 0; i < current.length; i += 2) {
      matches.push({ a: current[i], b: current[i + 1], winner: current[i + 1] === 'BYE' ? current[i] : (current[i] === 'BYE' ? current[i+1] : null) });
    }
    rounds.push({ label: roundNum === 1 ? 'Round 1' : `Round ${roundNum}`, matches });
    current = matches.map(() => '—'); // placeholders, winners advance manually via UI
    roundNum++;
  }
  return rounds;
}

function renderBracket(rounds, formatLabel) {
  const out = document.getElementById('bracket-output');
  const html = rounds.map(round => `
    <div class="bracket-round">
      <h4>${round.label}</h4>
      ${round.matches.map(m => `
        <div class="match">
          <div class="side ${m.winner === m.a ? 'winner' : ''}">${m.a}</div>
          <div class="side ${m.winner === m.b ? 'winner' : ''}">${m.b}</div>
        </div>
      `).join('')}
    </div>
  `).join('');
  out.innerHTML = `
    <p class="eyebrow" style="display:block;margin-bottom:12px;">${formatLabel}</p>
    <div class="bracket">${html}</div>
    <p style="margin-top:16px;font-family:var(--font-mono);font-size:0.78rem;color:var(--text-dim);">
      Click a side to mark the winner and advance them. BYE slots auto-advance the opposing team.
    </p>
  `;
  out.querySelectorAll('.side').forEach(side => {
    side.addEventListener('click', () => {
      const match = side.closest('.match');
      match.querySelectorAll('.side').forEach(s => s.classList.remove('winner'));
      side.classList.add('winner');
      himawariSet(HIMAWARI_KEYS.bracket, out.innerHTML);
    });
  });
}

function renderRoundRobin(teams) {
  const out = document.getElementById('bracket-output');
  const rows = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      rows.push(`${teams[i]} vs ${teams[j]}`);
    }
  }
  out.innerHTML = `
    <p class="eyebrow" style="display:block;margin-bottom:12px;">Round robin — ${rows.length} matches</p>
    <div class="grid grid-2">${rows.map(r => `<div class="match"><div class="side">${r}</div></div>`).join('')}</div>
  `;
}

document.getElementById('bracket-generate').addEventListener('click', () => {
  const raw = document.getElementById('bracket-teams').value.trim();
  const teams = raw.split('\n').map(t => t.trim()).filter(Boolean);
  const note = document.getElementById('bracket-note');

  if (teams.length < 2) {
    note.textContent = 'Enter at least 2 teams, one per line.';
    return;
  }

  let format = document.getElementById('bracket-format').value;
  let autoNote = '';
  if (format === 'auto') {
    format = suggestFormat(teams.length);
    autoNote = ` — auto-suggested for ${teams.length} teams (small field \u2192 single elim, mid-size \u2192 double elim, large field \u2192 round robin groups). Change the dropdown to override.`;
  }

  const shuffled = shuffle(teams);
  if (format === 'round-robin') {
    renderRoundRobin(shuffled);
    note.textContent = `Round robin bracket generated.${autoNote}`;
  } else {
    const rounds = buildSingleElim(shuffled);
    const label = format === 'double'
      ? 'Single-elim view shown — double elim losers bracket: track manually or extend this generator per your format needs'
      : 'Single elimination';
    renderBracket(rounds, label);
    note.textContent = `${format === 'double' ? 'Double' : 'Single'} elimination bracket generated for ${teams.length} teams.${autoNote}`;
  }
});

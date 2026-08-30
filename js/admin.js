/* ============================================================
   HIMAWARI CLAN — Admin Control Room Script (admin.js)
   Handles demo authentication, tab navigation, applicant management,
   announcements, roster updates, tournaments, and bracket image uploads.

   Data for announcements / roster / tournaments / applicants / bracket is
   read from and written to the live D1-backed API (/api/<table>).
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.page !== 'admin') return;

  // --- API Helpers ---
  async function apiList(table) {
    const res = await fetch(`/api/${table}`);
    if (!res.ok) throw new Error(`Failed to load ${table}`);
    return res.json();
  }

  async function apiSave(table, payload) {
    const res = await fetch(`/api/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`Failed to save ${table}`);
    return res.json();
  }

  async function apiDelete(table, id) {
    const res = await fetch(`/api/${table}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete from ${table}`);
    return res.json();
  }

  // --- Helper: File to Base64 ---
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve('');
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // --- DOM Elements ---
  const loginGate = document.getElementById('login-gate');
  const loginBtn = document.getElementById('login-btn');
  const loginUser = document.getElementById('admin-user');
  const loginPass = document.getElementById('admin-pass');
  const loginError = document.getElementById('login-error');

  const adminApp = document.getElementById('admin-app');
  const logoutBtn = document.getElementById('logout-btn');

  const tabs = document.querySelectorAll('.admin-tab');
  const panels = document.querySelectorAll('.admin-panel');
  const applicantBadge = document.getElementById('applicant-count-badge');

  const DEMO_USER = 'admin';
  const DEMO_PASS = 'himawari2026';

  // --- Auth Flow ---
  function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('himawari_admin_auth') === 'true';
    if (isAuthenticated) {
      loginGate.style.display = 'none';
      adminApp.style.display = 'block';
      renderAllPanels();
    } else {
      loginGate.style.display = 'block';
      adminApp.style.display = 'none';
    }
  }

  loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const user = loginUser.value.trim();
    const pass = loginPass.value.trim();

    if (user === DEMO_USER && pass === DEMO_PASS) {
      sessionStorage.setItem('himawari_admin_auth', 'true');
      loginError.textContent = '';
      loginUser.value = '';
      loginPass.value = '';
      checkAuth();
    } else {
      loginError.textContent = 'Invalid credentials. Please check your username and password.';
    }
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('himawari_admin_auth');
    checkAuth();
  });

  // --- Tab Navigation ---
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(`panel-${targetTab}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  function renderAllPanels() {
    renderAnnouncements();
    renderRoster();
    renderApplicants();
    renderTournaments();
    renderBracketPreview();
  }

  // --- 1. Announcements Module ---
  const announceForm = document.getElementById('announce-form');
  const announceId = document.getElementById('announce-id');
  const announceTitle = document.getElementById('announce-title');
  const announceDate = document.getElementById('announce-date');
  const announceBody = document.getElementById('announce-body');
  const announceCancel = document.getElementById('announce-cancel');
  const announceList = document.getElementById('announce-list');

  let cachedAnnouncements = [];

  async function renderAnnouncements() {
    try {
      cachedAnnouncements = await apiList('announcements');
    } catch (e) {
      console.error('Announcements load error:', e);
      announceList.innerHTML = '<p style="color:var(--text-dim);font-family:var(--font-mono);font-size:0.85rem;">Could not load announcements.</p>';
      return;
    }

    if (cachedAnnouncements.length === 0) {
      announceList.innerHTML = '<p style="color:var(--text-dim);font-family:var(--font-mono);font-size:0.85rem;">No announcements created yet.</p>';
      return;
    }

    announceList.innerHTML = cachedAnnouncements.map((item) => `
      <div class="card" style="margin-bottom:12px;padding:16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
          <div>
            <span class="eyebrow">${item.date}</span>
            <h3 style="font-size:1.1rem;margin:4px 0 8px;">${escapeHtml(item.title)}</h3>
            <p style="color:var(--text-dim);font-size:0.9rem;">${escapeHtml(item.body)}</p>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0;">
            <button class="btn btn-ghost" onclick="editAnnouncement('${item.id}')" style="padding:6px 12px;font-size:0.75rem;">Edit</button>
            <button class="btn btn-ghost" onclick="deleteAnnouncement('${item.id}')" style="padding:6px 12px;font-size:0.75rem;color:var(--ember);">Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  announceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = announceId.value;

    const payload = {
      id: id || `ann-${Date.now()}`,
      title: announceTitle.value.trim(),
      date: announceDate.value,
      body: announceBody.value.trim()
    };

    try {
      await apiSave('announcements', payload);
      resetAnnounceForm();
      await renderAnnouncements();
    } catch (e) {
      console.error('Announcement save error:', e);
      alert('Could not save the announcement. Please try again.');
    }
  });

  function resetAnnounceForm() {
    announceForm.reset();
    announceId.value = '';
    announceCancel.style.display = 'none';
  }

  announceCancel.addEventListener('click', resetAnnounceForm);

  window.editAnnouncement = function(id) {
    const item = cachedAnnouncements.find((i) => i.id === id);
    if (!item) return;

    announceId.value = item.id;
    announceTitle.value = item.title;
    announceDate.value = item.date;
    announceBody.value = item.body;
    announceCancel.style.display = 'inline-block';
    window.scrollTo({ top: announceForm.offsetTop - 80, behavior: 'smooth' });
  };

  window.deleteAnnouncement = async function(id) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await apiDelete('announcements', id);
      await renderAnnouncements();
    } catch (e) {
      console.error('Announcement delete error:', e);
      alert('Could not delete the announcement. Please try again.');
    }
  };

  // --- 2. Roster Module ---
  const rosterForm = document.getElementById('roster-form');
  const rosterId = document.getElementById('roster-id');
  const rosterInitials = document.getElementById('roster-initials');
  const rosterName = document.getElementById('roster-name');
  const rosterTier = document.getElementById('roster-tier');
  const rosterRole = document.getElementById('roster-role');
  const rosterMeta = document.getElementById('roster-meta');
  const rosterAvatar = document.getElementById('roster-avatar');
  const rosterKd = document.getElementById('roster-kd');
  const rosterLoadout = document.getElementById('roster-loadout');
  const rosterTwitch = document.getElementById('roster-twitch');
  const rosterYoutube = document.getElementById('roster-youtube');
  const rosterX = document.getElementById('roster-x');
  const rosterCancel = document.getElementById('roster-cancel');
  const rosterList = document.getElementById('roster-list');

  let cachedRoster = [];

  async function renderRoster() {
    try {
      cachedRoster = await apiList('roster');
    } catch (e) {
      console.error('Roster load error:', e);
      rosterList.innerHTML = '<p style="color:var(--text-dim);font-family:var(--font-mono);font-size:0.85rem;">Could not load the roster.</p>';
      return;
    }

    if (cachedRoster.length === 0) {
      rosterList.innerHTML = '<p style="color:var(--text-dim);font-family:var(--font-mono);font-size:0.85rem;">No members in roster.</p>';
      return;
    }

    rosterList.innerHTML = cachedRoster.map((item) => `
      <div class="card" style="margin-bottom:12px;padding:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
          <div style="display:flex;align-items:center;gap:16px;">
            <div style="width:40px;height:40px;background:var(--panel-alt);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;color:var(--gold);overflow:hidden;">
              ${item.avatar_url ? `<img src="${escapeHtml(item.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;">` : escapeHtml(item.initials)}
            </div>
            <div>
              <h3 style="font-size:1.05rem;margin:0;">
                ${escapeHtml(item.name)}
                <span style="font-size:0.72rem;color:var(--bg);background:var(--gold);font-family:var(--font-mono);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 7px;margin-left:8px;">${escapeHtml(item.tier || 'Member')}</span>
                <span style="font-size:0.8rem;color:var(--gold);font-family:var(--font-mono);font-weight:400;margin-left:6px;">[${escapeHtml(item.role)}]</span>
              </h3>
              <p style="color:var(--text-dim);font-size:0.8rem;margin-top:2px;">${escapeHtml(item.meta)}</p>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost" onclick="editRoster('${item.id}')" style="padding:6px 12px;font-size:0.75rem;">Edit</button>
            <button class="btn btn-ghost" onclick="deleteRoster('${item.id}')" style="padding:6px 12px;font-size:0.75rem;color:var(--ember);">Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  rosterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = rosterId.value;
    const avatarFile = rosterAvatar.files[0];

    let avatarDataUrl = '';
    if (avatarFile) {
      avatarDataUrl = await fileToBase64(avatarFile);
    } else if (id) {
      const existing = cachedRoster.find((i) => i.id === id);
      if (existing) avatarDataUrl = existing.avatar_url || '';
    }

    const payload = {
      id: id || `p${Date.now()}`,
      initials: rosterInitials.value.trim().toUpperCase(),
      name: rosterName.value.trim(),
      tier: rosterTier.value,
      role: rosterRole.value.trim(),
      meta: rosterMeta.value.trim(),
      avatar_url: avatarDataUrl,
      kd: rosterKd.value ? parseFloat(rosterKd.value) : null,
      loadout: rosterLoadout.value.trim(),
      twitch: rosterTwitch.value.trim(),
      youtube: rosterYoutube.value.trim(),
      x_handle: rosterX.value.trim()
    };

    try {
      await apiSave('roster', payload);
      resetRosterForm();
      await renderRoster();
    } catch (e) {
      console.error('Roster save error:', e);
      alert('Could not save this member. Please try again.');
    }
  });

  function resetRosterForm() {
    rosterForm.reset();
    rosterId.value = '';
    rosterTier.value = 'Member';
    rosterCancel.style.display = 'none';
  }

  rosterCancel.addEventListener('click', resetRosterForm);

  window.editRoster = function(id) {
    const item = cachedRoster.find((i) => i.id === id);
    if (!item) return;

    rosterId.value = item.id;
    rosterInitials.value = item.initials;
    rosterName.value = item.name;
    rosterTier.value = item.tier || 'Member';
    rosterRole.value = item.role;
    rosterMeta.value = item.meta;
    rosterAvatar.value = '';
    rosterKd.value = item.kd ?? '';
    rosterLoadout.value = item.loadout || '';
    rosterTwitch.value = item.twitch || '';
    rosterYoutube.value = item.youtube || '';
    rosterX.value = item.x_handle || '';
    rosterCancel.style.display = 'inline-block';
    window.scrollTo({ top: rosterForm.offsetTop - 80, behavior: 'smooth' });
  };

  window.deleteRoster = async function(id) {
    if (!confirm('Remove this member from the roster?')) return;
    try {
      await apiDelete('roster', id);
      await renderRoster();
    } catch (e) {
      console.error('Roster delete error:', e);
      alert('Could not remove this member. Please try again.');
    }
  };

  // --- 3. Applicants Module ---
  const applicantList = document.getElementById('applicant-list');

  async function renderApplicants() {
    let list;
    try {
      list = await apiList('applicants');
    } catch (e) {
      console.error('Applicants load error:', e);
      applicantList.innerHTML = '<p style="color:var(--text-dim);font-family:var(--font-mono);font-size:0.85rem;">Could not load applicants.</p>';
      return;
    }

    applicantBadge.textContent = list.length ? `(${list.length})` : '';

    if (list.length === 0) {
      applicantList.innerHTML = '<p style="color:var(--text-dim);font-family:var(--font-mono);font-size:0.85rem;">No active applications found.</p>';
      return;
    }

    applicantList.innerHTML = list.map((item) => `
      <div class="card" style="margin-bottom:14px;padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;">
          <div>
            <span class="eyebrow">${item.date || 'Recent'}</span>
            <h3 style="font-size:1.2rem;margin:4px 0 2px;">${escapeHtml(item.ign)}</h3>
            <span style="font-family:var(--font-mono);font-size:0.82rem;color:var(--gold);">Discord: ${escapeHtml(item.discord || 'N/A')}</span>
          </div>
          <button class="btn btn-ghost" onclick="deleteApplicant('${item.id}')" style="padding:6px 12px;font-size:0.75rem;color:var(--ember);">Dismiss</button>
        </div>
        <div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:12px;">
          <strong>Rank:</strong> ${escapeHtml(item.rank || 'Unspecified')}
        </div>
        ${item.notes ? `<p style="font-size:0.88rem;line-height:1.5;background:var(--panel-alt);padding:10px 14px;border:1px solid var(--line);">${escapeHtml(item.notes)}</p>` : ''}
      </div>
    `).join('');
  }

  window.deleteApplicant = async function(id) {
    if (!confirm('Dismiss this applicant?')) return;
    try {
      await apiDelete('applicants', id);
      await renderApplicants();
    } catch (e) {
      console.error('Applicant delete error:', e);
      alert('Could not dismiss this applicant. Please try again.');
    }
  };

  // --- 4. Tournaments Module ---
  const tourneyForm = document.getElementById('tourney-form');
  const tourneyId = document.getElementById('tourney-id');
  const tourneyName = document.getElementById('tourney-name');
  const tourneyDate = document.getElementById('tourney-date');
  const tourneyFormat = document.getElementById('tourney-format');
  const tourneyStatus = document.getElementById('tourney-status');
  const tourneyCancel = document.getElementById('tourney-cancel');
  const tourneyList = document.getElementById('tourney-list');

  let cachedTournaments = [];

  async function renderTournaments() {
    try {
      cachedTournaments = await apiList('tournaments');
    } catch (e) {
      console.error('Tournaments load error:', e);
      tourneyList.innerHTML = '<p style="color:var(--text-dim);font-family:var(--font-mono);font-size:0.85rem;">Could not load tournaments.</p>';
      return;
    }

    if (cachedTournaments.length === 0) {
      tourneyList.innerHTML = '<p style="color:var(--text-dim);font-family:var(--font-mono);font-size:0.85rem;">No tournament records.</p>';
      return;
    }

    tourneyList.innerHTML = cachedTournaments.map((item) => `
      <div class="card" style="margin-bottom:12px;padding:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
          <div>
            <span class="eyebrow">${item.date} · ${escapeHtml(item.format)}</span>
            <h3 style="font-size:1.1rem;margin:4px 0 2px;">${escapeHtml(item.name)}</h3>
            <p style="color:var(--gold);font-family:var(--font-mono);font-size:0.8rem;">Status: ${escapeHtml(item.status || 'Scheduled')}</p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost" onclick="editTournament('${item.id}')" style="padding:6px 12px;font-size:0.75rem;">Edit</button>
            <button class="btn btn-ghost" onclick="deleteTournament('${item.id}')" style="padding:6px 12px;font-size:0.75rem;color:var(--ember);">Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  tourneyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = tourneyId.value;

    const payload = {
      id: id || `trn-${Date.now()}`,
      name: tourneyName.value.trim(),
      date: tourneyDate.value,
      format: tourneyFormat.value,
      status: tourneyStatus.value.trim()
    };

    try {
      await apiSave('tournaments', payload);
      resetTourneyForm();
      await renderTournaments();
    } catch (e) {
      console.error('Tournament save error:', e);
      alert('Could not save this tournament. Please try again.');
    }
  });

  function resetTourneyForm() {
    tourneyForm.reset();
    tourneyId.value = '';
    tourneyCancel.style.display = 'none';
  }

  tourneyCancel.addEventListener('click', resetTourneyForm);

  window.editTournament = function(id) {
    const item = cachedTournaments.find((i) => i.id === id);
    if (!item) return;

    tourneyId.value = item.id;
    tourneyName.value = item.name;
    tourneyDate.value = item.date;
    tourneyFormat.value = item.format;
    tourneyStatus.value = item.status;
    tourneyCancel.style.display = 'inline-block';
    window.scrollTo({ top: tourneyForm.offsetTop - 80, behavior: 'smooth' });
  };

  window.deleteTournament = async function(id) {
    if (!confirm('Delete this tournament entry?')) return;
    try {
      await apiDelete('tournaments', id);
      await renderTournaments();
    } catch (e) {
      console.error('Tournament delete error:', e);
      alert('Could not delete this tournament. Please try again.');
    }
  };

  // --- 5. Bracket Image Upload Module ---
  const bracketForm = document.getElementById('bracket-upload-form');
  const bracketPreview = document.getElementById('bracket-preview');

  async function renderBracketPreview() {
    if (!bracketPreview) return;
    try {
      const data = await apiList('bracket');
      const item = Array.isArray(data) ? data[0] : data;
      if (item && item.image_url) {
        bracketPreview.innerHTML = `
          <h4 style="font-family:var(--font-display);font-size:1.1rem;margin-bottom:12px;color:var(--gold);">${escapeHtml(item.title || 'Tournament Bracket')}</h4>
          <img src="${escapeHtml(item.image_url)}" alt="Bracket Image" style="max-width:100%; height:auto; border-radius:8px; border:1px solid var(--line);">
        `;
      } else {
        bracketPreview.innerHTML = '<p style="color:var(--text-dim);font-family:var(--font-mono);font-size:0.85rem;">No bracket image uploaded yet.</p>';
      }
    } catch (e) {
      console.error('Bracket preview error:', e);
      bracketPreview.innerHTML = '<p style="color:var(--text-dim);font-family:var(--font-mono);font-size:0.85rem;">No bracket image uploaded yet.</p>';
    }
  }

  if (bracketForm) {
    bracketForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const note = document.getElementById('bracket-upload-note');
      const noteText = document.getElementById('bracket-upload-note-text');
      const titleInput = document.getElementById('bracket-title-input');
      const fileInput = document.getElementById('bracket-image-input');

      if (!fileInput.files.length) return;

      try {
        const imageBase64 = await fileToBase64(fileInput.files[0]);
        const payload = {
          id: 'current-bracket',
          title: titleInput.value.trim(),
          image_url: imageBase64,
          updated_at: new Date().toISOString()
        };

        await apiSave('bracket', payload);

        note.className = 'status-chip success visible';
        noteText.textContent = 'Bracket image updated successfully!';

        renderBracketPreview();
      } catch (err) {
        console.error('Bracket upload failed:', err);
        note.className = 'status-chip error visible';
        noteText.textContent = 'Failed to upload bracket image. Please try again.';
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  checkAuth();
});

document.addEventListener('DOMContentLoaded', () => {
  // ============ STORAGE KEYS & INITIAL DATA ============
  const STORAGE_KEYS = {
    ANNOUNCEMENTS: 'himawari_announcements',
    ROSTER: 'himawari_roster',
    APPLICANTS: 'himawari_applicants',
    TOURNAMENTS: 'himawari_tournaments',
    BRACKET: 'himawari_bracket',
    AUTH: 'adminLoggedIn'
  };

  const getStore = (key, fallback = []) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`Error loading ${key}:`, e);
      return fallback;
    }
  };

  const setStore = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving ${key}:`, e);
    }
  };

  // Seed initial sample data if empty
  if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
    setStore(STORAGE_KEYS.ANNOUNCEMENTS, [
      { id: '1', title: 'Season 4 Tryouts Open', date: '2026-03-01', body: 'Roster expansion in progress. Submit applications via join page.' }
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ROSTER)) {
    setStore(STORAGE_KEYS.ROSTER, [
      { id: '1', initials: 'HMW', name: 'Kage', tier: 'Leadership', role: 'IGL', meta: 'Team Founder', avatar: '', kd: '2.45', loadout: 'Kilo 141 / MW50', twitch: 'kage_fps', youtube: '', x: '' }
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.APPLICANTS)) {
    setStore(STORAGE_KEYS.APPLICANTS, [
      { id: '1', name: 'Ronin', role: 'Sniper / Flex', kd: '1.95', discord: 'ronin#1234', experience: '2 years competitive play', date: '2026-03-02', status: 'Pending' }
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TOURNAMENTS)) {
    setStore(STORAGE_KEYS.TOURNAMENTS, [
      { id: '1', name: 'Himawari Invitational Vol. 1', date: '2026-03-15', format: 'Single elimination', status: 'Scheduled' }
    ]);
  }

  // ============ TAB NAVIGATION ============
  const tabs = document.querySelectorAll('.admin-tab');
  const panels = document.querySelectorAll('.admin-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPanel = tab.getAttribute('data-tab');

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const activePanel = document.getElementById(`panel-${targetPanel}`);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });

  // ============ LOGIN / AUTHENTICATION GATE ============
  const loginGate = document.getElementById('login-gate');
  const adminApp = document.getElementById('admin-app');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const loginError = document.getElementById('login-error');

  function checkAuth() {
    const isAuthenticated = localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
    if (isAuthenticated) {
      if (loginGate) loginGate.style.display = 'none';
      if (adminApp) adminApp.style.display = 'block';
      renderAll();
    } else {
      if (loginGate) loginGate.style.display = 'block';
      if (adminApp) adminApp.style.display = 'none';
    }
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const user = document.getElementById('admin-user')?.value.trim();
      const pass = document.getElementById('admin-pass')?.value.trim();

      if (user && pass) {
        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        if (loginError) loginError.textContent = '';
        checkAuth();
      } else {
        if (loginError) loginError.textContent = 'Please enter both username and password.';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      checkAuth();
    });
  }

  // ============ HELPER: FILE TO BASE64 ============
  function fileToBase64(file, maxWidth = 1600, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  // ============ 1. ANNOUNCEMENTS SECTION ============
  const announceForm = document.getElementById('announce-form');
  const announceCancel = document.getElementById('announce-cancel');
  const announceList = document.getElementById('announce-list');

  function renderAnnouncements() {
    if (!announceList) return;
    const announcements = getStore(STORAGE_KEYS.ANNOUNCEMENTS);

    if (announcements.length === 0) {
      announceList.innerHTML = '<p style="color:var(--text-dim, #888);font-size:0.85rem;">No published announcements.</p>';
      return;
    }

    announceList.innerHTML = announcements.map(item => `
      <div class="card" style="margin-bottom:12px;padding:14px;border:1px solid var(--line, #222);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <h4 style="font-size:1rem;margin-bottom:4px;">${escapeHtml(item.title)}</h4>
          <span style="font-family:var(--font-mono);font-size:0.75rem;color:var(--gold, #d4af37);">${escapeHtml(item.date)}</span>
        </div>
        <p style="font-size:0.85rem;color:var(--text-dim, #aaa);margin:8px 0;">${escapeHtml(item.body)}</p>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="btn btn-ghost" style="padding:4px 8px;font-size:0.75rem;" onclick="window.editAnnouncement('${item.id}')">Edit</button>
          <button class="btn btn-ghost" style="padding:4px 8px;font-size:0.75rem;color:var(--ember, #ff6b6b);" onclick="window.deleteAnnouncement('${item.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  if (announceForm) {
    announceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('announce-id')?.value || Date.now().toString();
      const title = document.getElementById('announce-title')?.value.trim();
      const date = document.getElementById('announce-date')?.value;
      const body = document.getElementById('announce-body')?.value.trim();

      let announcements = getStore(STORAGE_KEYS.ANNOUNCEMENTS);
      const existingIdx = announcements.findIndex(a => a.id === id);

      if (existingIdx > -1) {
        announcements[existingIdx] = { id, title, date, body };
      } else {
        announcements.unshift({ id, title, date, body });
      }

      setStore(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
      announceForm.reset();
      document.getElementById('announce-id').value = '';
      if (announceCancel) announceCancel.style.display = 'none';
      renderAnnouncements();
    });
  }

  if (announceCancel) {
    announceCancel.addEventListener('click', () => {
      announceForm.reset();
      document.getElementById('announce-id').value = '';
      announceCancel.style.display = 'none';
    });
  }

  window.editAnnouncement = (id) => {
    const announcements = getStore(STORAGE_KEYS.ANNOUNCEMENTS);
    const item = announcements.find(a => a.id === id);
    if (!item) return;

    document.getElementById('announce-id').value = item.id;
    document.getElementById('announce-title').value = item.title;
    document.getElementById('announce-date').value = item.date;
    document.getElementById('announce-body').value = item.body;
    if (announceCancel) announceCancel.style.display = 'inline-block';
  };

  window.deleteAnnouncement = (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    let announcements = getStore(STORAGE_KEYS.ANNOUNCEMENTS);
    announcements = announcements.filter(a => a.id !== id);
    setStore(STORAGE_KEYS.ANNOUNCEMENTS, announcements);
    renderAnnouncements();
  };

  // ============ 2. ROSTER SECTION ============
  const rosterForm = document.getElementById('roster-form');
  const rosterCancel = document.getElementById('roster-cancel');
  const rosterList = document.getElementById('roster-list');

  function renderRoster() {
    if (!rosterList) return;
    const roster = getStore(STORAGE_KEYS.ROSTER);

    if (roster.length === 0) {
      rosterList.innerHTML = '<p style="color:var(--text-dim, #888);font-size:0.85rem;">No members in roster.</p>';
      return;
    }

    rosterList.innerHTML = roster.map(m => `
      <div class="card" style="margin-bottom:12px;padding:14px;border:1px solid var(--line, #222);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${m.avatar ? `<img src="${m.avatar}" alt="${escapeHtml(m.name)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">` : `<div style="width:40px;height:40px;border-radius:50%;background:var(--line, #333);display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:0.8rem;">${escapeHtml(m.initials || 'HMW')}</div>`}
          <div>
            <h4 style="font-size:1rem;margin:0;">${escapeHtml(m.name)} <span style="font-size:0.75rem;color:var(--gold, #d4af37);">[${escapeHtml(m.tier)}]</span></h4>
            <span style="font-size:0.8rem;color:var(--text-dim, #aaa);">${escapeHtml(m.role || 'Member')} ${m.kd ? `• K/D: ${m.kd}` : ''}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-ghost" style="padding:4px 8px;font-size:0.75rem;" onclick="window.editRoster('${m.id}')">Edit</button>
          <button class="btn btn-ghost" style="padding:4px 8px;font-size:0.75rem;color:var(--ember, #ff6b6b);" onclick="window.deleteRoster('${m.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  if (rosterForm) {
    rosterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('roster-id')?.value || Date.now().toString();
      const initials = document.getElementById('roster-initials')?.value.trim();
      const name = document.getElementById('roster-name')?.value.trim();
      const tier = document.getElementById('roster-tier')?.value;
      const role = document.getElementById('roster-role')?.value.trim();
      const meta = document.getElementById('roster-meta')?.value.trim();
      const kd = document.getElementById('roster-kd')?.value;
      const loadout = document.getElementById('roster-loadout')?.value.trim();
      const twitch = document.getElementById('roster-twitch')?.value.trim();
      const youtube = document.getElementById('roster-youtube')?.value.trim();
      const x = document.getElementById('roster-x')?.value.trim();
      const avatarInput = document.getElementById('roster-avatar');

      let avatar = '';
      if (avatarInput?.files?.[0]) {
        try {
          avatar = await fileToBase64(avatarInput.files[0], 400, 0.8);
        } catch (err) {
          console.error('Avatar error:', err);
        }
      } else {
        const existing = getStore(STORAGE_KEYS.ROSTER).find(r => r.id === id);
        avatar = existing ? existing.avatar : '';
      }

      let roster = getStore(STORAGE_KEYS.ROSTER);
      const existingIdx = roster.findIndex(r => r.id === id);

      const memberObj = { id, initials, name, tier, role, meta, avatar, kd, loadout, twitch, youtube, x };

      if (existingIdx > -1) {
        roster[existingIdx] = memberObj;
      } else {
        roster.push(memberObj);
      }

      setStore(STORAGE_KEYS.ROSTER, roster);
      rosterForm.reset();
      document.getElementById('roster-id').value = '';
      if (rosterCancel) rosterCancel.style.display = 'none';
      renderRoster();
    });
  }

  if (rosterCancel) {
    rosterCancel.addEventListener('click', () => {
      rosterForm.reset();
      document.getElementById('roster-id').value = '';
      rosterCancel.style.display = 'none';
    });
  }

  window.editRoster = (id) => {
    const roster = getStore(STORAGE_KEYS.ROSTER);
    const item = roster.find(r => r.id === id);
    if (!item) return;

    document.getElementById('roster-id').value = item.id;
    document.getElementById('roster-initials').value = item.initials || '';
    document.getElementById('roster-name').value = item.name || '';
    document.getElementById('roster-tier').value = item.tier || 'Member';
    document.getElementById('roster-role').value = item.role || '';
    document.getElementById('roster-meta').value = item.meta || '';
    document.getElementById('roster-kd').value = item.kd || '';
    document.getElementById('roster-loadout').value = item.loadout || '';
    document.getElementById('roster-twitch').value = item.twitch || '';
    document.getElementById('roster-youtube').value = item.youtube || '';
    document.getElementById('roster-x').value = item.x || '';
    if (rosterCancel) rosterCancel.style.display = 'inline-block';
  };

  window.deleteRoster = (id) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    let roster = getStore(STORAGE_KEYS.ROSTER);
    roster = roster.filter(r => r.id !== id);
    setStore(STORAGE_KEYS.ROSTER, roster);
    renderRoster();
  };

  // ============ 3. APPLICANTS SECTION ============
  const applicantList = document.getElementById('applicant-list');
  const applicantBadge = document.getElementById('applicant-count-badge');

  function renderApplicants() {
    if (!applicantList) return;
    const applicants = getStore(STORAGE_KEYS.APPLICANTS);

    if (applicantBadge) {
      if (applicants.length > 0) {
        applicantBadge.textContent = applicants.length;
        applicantBadge.style.display = 'inline-block';
      } else {
        applicantBadge.style.display = 'none';
      }
    }

    if (applicants.length === 0) {
      applicantList.innerHTML = '<p style="color:var(--text-dim, #888);font-size:0.85rem;">No pending applications.</p>';
      return;
    }

    applicantList.innerHTML = applicants.map(a => `
      <div class="card" style="margin-bottom:12px;padding:16px;border:1px solid var(--line, #222);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          <div>
            <h4 style="font-size:1.1rem;margin-bottom:4px;">${escapeHtml(a.name)}</h4>
            <p style="font-family:var(--font-mono);font-size:0.8rem;color:var(--gold, #d4af37);margin-bottom:8px;">Discord: ${escapeHtml(a.discord)} | Role: ${escapeHtml(a.role)} | K/D: ${escapeHtml(a.kd)}</p>
          </div>
          <span style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-dim, #888);">${escapeHtml(a.date || '')}</span>
        </div>
        <p style="font-size:0.85rem;color:var(--text-dim, #aaa);margin-bottom:12px;">${escapeHtml(a.experience || 'No description provided.')}</p>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-primary" style="padding:6px 12px;font-size:0.8rem;" onclick="window.approveApplicant('${a.id}')">Approve & Add to Roster</button>
          <button class="btn btn-ghost" style="padding:6px 12px;font-size:0.8rem;color:var(--ember, #ff6b6b);" onclick="window.rejectApplicant('${a.id}')">Reject</button>
        </div>
      </div>
    `).join('');
  }

  window.approveApplicant = (id) => {
    let applicants = getStore(STORAGE_KEYS.APPLICANTS);
    const applicant = applicants.find(a => a.id === id);
    if (!applicant) return;

    // Add to roster
    let roster = getStore(STORAGE_KEYS.ROSTER);
    roster.push({
      id: Date.now().toString(),
      initials: applicant.name.substring(0, 3).toUpperCase(),
      name: applicant.name,
      tier: 'Member',
      role: applicant.role,
      kd: applicant.kd,
      meta: `Approved applicant (${applicant.discord})`,
      avatar: '',
      loadout: '',
      twitch: '',
      youtube: '',
      x: ''
    });
    setStore(STORAGE_KEYS.ROSTER, roster);

    // Remove applicant
    applicants = applicants.filter(a => a.id !== id);
    setStore(STORAGE_KEYS.APPLICANTS, applicants);

    renderApplicants();
    renderRoster();
  };

  window.rejectApplicant = (id) => {
    if (!confirm('Reject this applicant?')) return;
    let applicants = getStore(STORAGE_KEYS.APPLICANTS);
    applicants = applicants.filter(a => a.id !== id);
    setStore(STORAGE_KEYS.APPLICANTS, applicants);
    renderApplicants();
  };

  // ============ 4. TOURNAMENTS SECTION ============
  const tourneyForm = document.getElementById('tourney-form');
  const tourneyCancel = document.getElementById('tourney-cancel');
  const tourneyList = document.getElementById('tourney-list');

  function renderTournaments() {
    if (!tourneyList) return;
    const tournaments = getStore(STORAGE_KEYS.TOURNAMENTS);

    if (tournaments.length === 0) {
      tourneyList.innerHTML = '<p style="color:var(--text-dim, #888);font-size:0.85rem;">No tournaments logged.</p>';
      return;
    }

    tourneyList.innerHTML = tournaments.map(t => `
      <div class="card" style="margin-bottom:12px;padding:14px;border:1px solid var(--line, #222);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <h4 style="font-size:1rem;margin-bottom:4px;">${escapeHtml(t.name)}</h4>
          <span style="font-family:var(--font-mono);font-size:0.75rem;color:var(--gold, #d4af37);">${escapeHtml(t.date)}</span>
        </div>
        <p style="font-size:0.8rem;color:var(--text-dim, #aaa);margin:6px 0;">Format: ${escapeHtml(t.format)} | Status: <strong style="color:#7ee787;">${escapeHtml(t.status || 'Scheduled')}</strong></p>
        <div style="display:flex;gap:8px;margin-top:10px;">
          <button class="btn btn-ghost" style="padding:4px 8px;font-size:0.75rem;" onclick="window.editTournament('${t.id}')">Edit</button>
          <button class="btn btn-ghost" style="padding:4px 8px;font-size:0.75rem;color:var(--ember, #ff6b6b);" onclick="window.deleteTournament('${t.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  if (tourneyForm) {
    tourneyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('tourney-id')?.value || Date.now().toString();
      const name = document.getElementById('tourney-name')?.value.trim();
      const date = document.getElementById('tourney-date')?.value;
      const format = document.getElementById('tourney-format')?.value;
      const status = document.getElementById('tourney-status')?.value.trim() || 'Scheduled';

      let tournaments = getStore(STORAGE_KEYS.TOURNAMENTS);
      const existingIdx = tournaments.findIndex(t => t.id === id);

      if (existingIdx > -1) {
        tournaments[existingIdx] = { id, name, date, format, status };
      } else {
        tournaments.unshift({ id, name, date, format, status });
      }

      setStore(STORAGE_KEYS.TOURNAMENTS, tournaments);
      tourneyForm.reset();
      document.getElementById('tourney-id').value = '';
      if (tourneyCancel) tourneyCancel.style.display = 'none';
      renderTournaments();
    });
  }

  if (tourneyCancel) {
    tourneyCancel.addEventListener('click', () => {
      tourneyForm.reset();
      document.getElementById('tourney-id').value = '';
      tourneyCancel.style.display = 'none';
    });
  }

  window.editTournament = (id) => {
    const tournaments = getStore(STORAGE_KEYS.TOURNAMENTS);
    const item = tournaments.find(t => t.id === id);
    if (!item) return;

    document.getElementById('tourney-id').value = item.id;
    document.getElementById('tourney-name').value = item.name;
    document.getElementById('tourney-date').value = item.date;
    document.getElementById('tourney-format').value = item.format;
    document.getElementById('tourney-status').value = item.status || '';
    if (tourneyCancel) tourneyCancel.style.display = 'inline-block';
  };

  window.deleteTournament = (id) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    let tournaments = getStore(STORAGE_KEYS.TOURNAMENTS);
    tournaments = tournaments.filter(t => t.id !== id);
    setStore(STORAGE_KEYS.TOURNAMENTS, tournaments);
    renderTournaments();
  };

  // ============ 5. BRACKET IMAGE UPLOAD HANDLER ============
  const bracketForm = document.getElementById('bracket-upload-form');
  const fileInput = document.getElementById('bracket-image-input');
  const titleInput = document.getElementById('bracket-title-input');
  const submitBtn = document.getElementById('bracket-upload-btn');
  const noteBox = document.getElementById('bracket-upload-note');
  const noteText = document.getElementById('bracket-upload-note-text');
  const previewBox = document.getElementById('bracket-preview');

  function renderBracketPreview() {
    if (!previewBox) return;
    const currentBracket = getStore(STORAGE_KEYS.BRACKET, null);

    if (currentBracket && currentBracket.image_url) {
      previewBox.innerHTML = `
        <h4 style="color:var(--gold, #d4af37);margin-bottom:10px;">${escapeHtml(currentBracket.title)}</h4>
        <img src="${currentBracket.image_url}" alt="Current Bracket" style="max-width:100%;height:auto;border-radius:6px;border:1px solid var(--line, #333);">
        <p style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-dim, #888);margin-top:8px;">Updated: ${new Date(currentBracket.updated_at).toLocaleString()}</p>
      `;
    } else {
      previewBox.innerHTML = '<p style="color:var(--text-dim, #888);font-family:var(--font-mono);font-size:0.85rem;">No bracket image uploaded yet.</p>';
    }
  }

  if (bracketForm) {
    bracketForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const file = fileInput?.files[0];
      const title = titleInput?.value.trim() || 'Himawari Clan Championship 2026';

      if (!file) {
        if (noteBox && noteText) {
          noteBox.style.display = 'block';
          noteText.style.color = 'var(--ember, #ff6b6b)';
          noteText.textContent = 'Please select an image file.';
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
      }
      if (noteBox && noteText) {
        noteBox.style.display = 'block';
        noteText.style.color = 'var(--gold, #d4af37)';
        noteText.textContent = 'Compressing image...';
      }

      try {
        const base64Image = await fileToBase64(file, 1600, 0.8);

        if (noteText) noteText.textContent = 'Saving bracket image...';

        const payload = {
          title: title,
          image_url: base64Image,
          updated_at: new Date().toISOString()
        };

        // Try API request first if live backend exists, fallback to localStorage
        try {
          let res = await fetch('/api/bracket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            await fetch('/api/tournaments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          }
        } catch (netErr) {
          console.warn('API endpoint unavailable, storing locally:', netErr);
        }

        // Store locally so it displays immediately
        setStore(STORAGE_KEYS.BRACKET, payload);

        if (noteText) {
          noteText.style.color = '#7ee787';
          noteText.textContent = '✓ Bracket uploaded successfully!';
        }

        renderBracketPreview();
        bracketForm.reset();

      } catch (err) {
        console.error('Upload Error:', err);
        if (noteText) {
          noteText.style.color = 'var(--ember, #ff6b6b)';
          noteText.textContent = `Upload failed: ${err.message || 'Error processing image.'}`;
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Upload Bracket Image';
        }
      }
    });
  }

  // Utility HTML Sanitizer
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderAll() {
    renderAnnouncements();
    renderRoster();
    renderApplicants();
    renderTournaments();
    renderBracketPreview();
  }
});
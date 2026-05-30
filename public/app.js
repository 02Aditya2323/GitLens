/* ═══════════════════════════════════════════════════════════
   GitLens — Frontend Application v2
   ═══════════════════════════════════════════════════════════ */

const API = '/api';
let currentPage = 1;

// ── Tier config ──────────────────────────────────────────────
const TIERS = [
  { min: 700, name: 'Legend',      emoji: '🌟', color: '#ffd700', desc: 'Top-tier open source contributor' },
  { min: 450, name: 'Expert',      emoji: '💎', color: '#4f9cf9', desc: 'Highly influential developer' },
  { min: 220, name: 'Established', emoji: '⚡', color: '#06d6a0', desc: 'Well-established in the community' },
  { min: 80,  name: 'Rising',      emoji: '🔥', color: '#f59e0b', desc: 'Growing presence on GitHub' },
  { min: 0,   name: 'Beginner',    emoji: '🌱', color: '#94a3b8', desc: 'Just getting started' },
];

function getTier(score) {
  return TIERS.find(t => score >= t.min) || TIERS[TIERS.length - 1];
}

// ── GitHub username / URL extractor (mirrors server-side util) ──
function extractGitHubUsername(input) {
  if (!input) return null;
  const t = input.trim();
  const m = t.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9][a-zA-Z0-9-]{0,37}[a-zA-Z0-9]?)\/?(?:[?#].*)?$/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9]$/.test(t) || /^[a-zA-Z0-9][a-zA-Z0-9-]{0,37}[a-zA-Z0-9]?$/.test(t)) return t;
  return null;
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  checkHealth();
  document.getElementById('usernameInput').addEventListener('keydown', e => { if (e.key === 'Enter') analyzeProfile(); });
  window.addEventListener('scroll', () => document.getElementById('navbar').classList.toggle('scrolled', scrollY > 10));
});

// ── Navigation ────────────────────────────────────────────────
function initNav() {
  document.querySelectorAll('.nav-tab').forEach(tab =>
    tab.addEventListener('click', () => switchView(tab.dataset.view))
  );
}
function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`view${cap(view)}`).classList.add('active');
  document.querySelector(`[data-view="${view}"]`).classList.add('active');
  if (view === 'profiles')    loadProfiles();
  if (view === 'leaderboard') loadLeaderboard();
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Health ────────────────────────────────────────────────────
async function checkHealth() {
  try {
    const { success } = await (await fetch(`${API}/health`)).json();
    setStatus(success);
  } catch { setStatus(false); }
}
function setStatus(ok) {
  const dot  = document.querySelector('.status-dot');
  const text = document.querySelector('.status-text');
  dot.style.background  = ok ? 'var(--accent)' : 'var(--danger)';
  dot.style.boxShadow   = ok ? '0 0 8px var(--accent)' : '0 0 8px var(--danger)';
  text.textContent      = ok ? 'API Online' : 'API Offline';
}

// ── Quick search chips ────────────────────────────────────────
function quickSearch(val) {
  document.getElementById('usernameInput').value = val;
  analyzeProfile();
}

// ── Analyze ───────────────────────────────────────────────────
async function analyzeProfile() {
  const raw      = document.getElementById('usernameInput').value;
  const username = extractGitHubUsername(raw);
  if (!username) { showToast('Enter a valid GitHub username or URL.', 'error'); return; }

  hideAll();
  showLoading(true);
  startLoaderSteps();

  try {
    const res  = await fetch(`${API}/analyze/${encodeURIComponent(username)}`, { method: 'POST' });
    const json = await res.json();
    showLoading(false);
    if (!res.ok || !json.success) { showError(json.message || 'Something went wrong.'); return; }
    renderProfileResult(json.data);
    showToast(`✅ "${json.data.username}" analyzed!`, 'success');
  } catch {
    showLoading(false);
    showError('Could not reach the API. Is the server running?');
  }
}

// ── Loader steps ──────────────────────────────────────────────
let stepTimer;
function startLoaderSteps() {
  const ids = ['step1','step2','step3','step4','step5'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.className = 'loader-step'; });
  let i = 0;
  if (document.getElementById(ids[0])) document.getElementById(ids[0]).classList.add('active');
  stepTimer = setInterval(() => {
    const el = document.getElementById(ids[i]);
    if (el) { el.classList.remove('active'); el.classList.add('done'); }
    i++;
    if (i < ids.length && document.getElementById(ids[i])) document.getElementById(ids[i]).classList.add('active');
    else clearInterval(stepTimer);
  }, 1000);
}
function showLoading(show) {
  document.getElementById('loadingWrap').classList.toggle('hidden', !show);
  document.getElementById('analyzeBtn').disabled = show;
  if (!show) clearInterval(stepTimer);
}
function hideAll() {
  ['loadingWrap','errorAlert','profileResult'].forEach(id => document.getElementById(id).classList.add('hidden'));
}
function showError(msg) {
  document.getElementById('errorMsg').textContent = msg;
  document.getElementById('errorAlert').classList.remove('hidden');
}

// ── Render Profile ────────────────────────────────────────────
function renderProfileResult(d) {
  const el = document.getElementById('profileResult');
  el.innerHTML = buildProfileHTML(d);
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildProfileHTML(d) {
  const tier     = getTier(d.contribution_score || 0);
  const score    = d.contribution_score || 0;
  const joinDate = d.github_created_at
    ? new Date(d.github_created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '—';

  const langs    = Object.entries(d.languages_breakdown || {}).slice(0, 8);
  const maxLang  = langs[0]?.[1] || 1;
  const topics   = d.all_topics || [];
  const orgs     = d.organizations || [];
  const social   = d.social_accounts || [];
  const events   = d.recent_events_summary;

  const socialIcons = {
    twitter: '🐦', linkedin: '💼', youtube: '▶️', twitch: '💜',
    facebook: '📘', npm: '📦', mastodon: '🐘', generic: '🔗',
  };

  return `
  <!-- Tier Banner -->
  <div class="tier-banner">
    <div class="tier-badge-wrap">
      <div class="tier-icon">${tier.emoji}</div>
      <div>
        <div class="tier-name" style="color:${tier.color}">${tier.name}</div>
        <div class="tier-desc">${tier.desc}</div>
      </div>
    </div>
    <div class="tier-score-wrap">
      <div class="tier-score-label">GitLens Score</div>
      <div class="tier-score-val">${score} <span style="font-size:1rem;opacity:.5">/ 1000</span></div>
    </div>
    <div class="tier-bar-wrap">
      <div class="tier-bar-bg"><div class="tier-bar" style="width:${Math.round((score/1000)*100)}%"></div></div>
    </div>
  </div>

  <!-- Header -->
  <div class="profile-header-card">
    <img src="${d.avatar_url || ''}" alt="${d.username}" class="profile-avatar" />
    <div class="profile-info">
      <div class="profile-name">${d.name || d.username}</div>
      <div class="profile-login">@${d.username}</div>
      ${d.bio ? `<div class="profile-bio">${d.bio}</div>` : ''}
      <div class="profile-meta">
        ${d.location  ? `<span class="meta-item"><svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>${d.location}</span>` : ''}
        ${d.company   ? `<span class="meta-item">🏢 ${d.company}</span>` : ''}
        ${d.blog      ? `<span class="meta-item">🔗 <a href="${d.blog}" target="_blank" style="color:inherit">${d.blog.replace(/https?:\/\//,'')}</a></span>` : ''}
        ${d.twitter_username ? `<span class="meta-item">🐦 @${d.twitter_username}</span>` : ''}
        <span class="meta-item">📅 Joined ${joinDate}</span>
        ${d.account_age_days ? `<span class="meta-item">🕐 ${Math.floor(d.account_age_days/365)}y ${Math.floor((d.account_age_days%365)/30)}m</span>` : ''}
        ${d.hireable ? `<span class="meta-item text-accent">✓ Hireable</span>` : ''}
        ${d.has_profile_readme ? `<span class="readme-badge">📄 Profile README</span>` : ''}
      </div>
    </div>
    <div class="profile-actions">
      <a href="${d.github_profile_url || `https://github.com/${d.username}`}" target="_blank" class="btn-github">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.29.5.09.68-.22.68-.48v-1.7c-2.78.61-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.004 1.7.115 2.5.337 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"/></svg>
        GitHub Profile
      </a>
      <button class="btn-export" onclick="exportProfileJson('${d.username}')">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="display:inline-block;margin-right:4px;vertical-align:text-bottom"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
        Export JSON
      </button>
      <button class="btn-export" onclick="exportProfileCsv('${d.username}')">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="display:inline-block;margin-right:4px;vertical-align:text-bottom"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
        Export CSV
      </button>
      <button class="btn-delete" onclick="deleteProfile('${d.username}')">🗑 Remove</button>
    </div>
  </div>

  <!-- Stats Grid -->
  <div class="stats-grid">
    ${statCard('📦', fmt(d.public_repos),         'Repositories')}
    ${statCard('🔓', fmt(d.original_repos_count), 'Original Repos')}
    ${statCard('🍴', fmt(d.fork_repos_count),     'Forked Repos')}
    ${statCard('👥', fmt(d.followers),            'Followers')}
    ${statCard('👣', fmt(d.following),            'Following')}
    ${statCard('⭐', fmt(d.total_stars),          'Total Stars')}
    ${statCard('⭐̈', fmt(d.avg_stars_per_repo),  'Avg Stars/Repo')}
    ${statCard('🍴', fmt(d.total_forks),          'Total Forks')}
    ${statCard('🐛', fmt(d.total_open_issues),    'Open Issues')}
    ${statCard('📋', fmt(d.public_gists),         'Gists')}
    ${statCard('💾', fmtKb(d.total_size_kb),      'Total Repo Size')}
    ${statCard('📅', `${Math.floor((d.account_age_days||0)/365)}y`, 'Account Age')}
  </div>

  <!-- Languages + Top Repos -->
  <div class="info-grid">
    ${langs.length ? `
    <div class="info-card">
      <div class="info-card-title">Languages Used</div>
      <div class="lang-list">
        ${langs.map(([lang, cnt]) => `
          <div>
            <div class="lang-meta"><span class="lang-name">${lang}</span><span class="lang-count">${cnt} repo${cnt>1?'s':''}</span></div>
            <div class="lang-bar-bg"><div class="lang-bar" style="width:${Math.round((cnt/maxLang)*100)}%"></div></div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    ${(d.top_repos||[]).length ? `
    <div class="info-card">
      <div class="info-card-title">Top Repositories</div>
      <div class="repo-list">
        ${(d.top_repos||[]).slice(0,6).map(r => `
          <a href="${r.url}" target="_blank" class="repo-item">
            <div class="repo-item-left">
              <div class="repo-name">${r.name}</div>
              ${r.description ? `<div class="repo-desc">${r.description}</div>` : ''}
              ${r.language ? `<span class="repo-lang-chip">${r.language}</span>` : ''}
            </div>
            <div class="repo-stars">⭐ ${fmt(r.stars)}</div>
          </a>`).join('')}
      </div>
    </div>` : ''}
  </div>

  <!-- Topics + Orgs + Social -->
  <div class="info-grid-3">
    ${topics.length ? `
    <div class="info-card">
      <div class="info-card-title">Repository Topics</div>
      <div class="topics-cloud">
        ${topics.map(t => `<span class="topic-tag">#${t}</span>`).join('')}
      </div>
    </div>` : ''}

    ${orgs.length ? `
    <div class="info-card">
      <div class="info-card-title">Organizations (${orgs.length})</div>
      <div class="orgs-list">
        ${orgs.map(o => `
          <a href="${o.url}" target="_blank" class="org-item">
            <img src="${o.avatar_url}" alt="${o.login}" class="org-avatar" />
            <div>
              <div class="org-login">${o.login}</div>
              ${o.description ? `<div class="org-desc">${o.description.slice(0,50)}${o.description.length>50?'…':''}</div>` : ''}
            </div>
          </a>`).join('')}
      </div>
    </div>` : ''}

    ${social.length ? `
    <div class="info-card">
      <div class="info-card-title">Social Accounts</div>
      <div class="social-list">
        ${social.map(s => {
          const prov = s.provider?.toLowerCase() || 'generic';
          const icon = socialIcons[prov] || socialIcons.generic;
          return `<a href="${s.url}" target="_blank" class="social-item"><span class="social-icon">${icon}</span> ${cap(prov)}</a>`;
        }).join('')}
      </div>
    </div>` : ''}
  </div>

  <!-- Recent Activity -->
  ${events ? `
  <div class="info-card" style="margin-bottom:20px">
    <div class="info-card-title">Recent Activity (last 100 events)</div>
    <div style="margin-bottom:12px;font-size:0.82rem;color:var(--text-2)">
      ${events.last_active_at ? `Last active: ${new Date(events.last_active_at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'})}` : ''}
      · Active in ${events.active_repos?.length || 0} repos
    </div>
    <div class="activity-grid">
      ${Object.entries(events.event_types||{})
        .sort(([,a],[,b])=>b-a)
        .map(([type, cnt]) => `
          <div class="activity-item">
            <div class="activity-count">${cnt}</div>
            <div class="activity-type">${type.replace('Event','')}</div>
          </div>`).join('')}
    </div>
  </div>` : ''}
  `;
}

function statCard(icon, value, label) {
  return `
  <div class="stat-card">
    <div class="stat-icon">${icon}</div>
    <div class="stat-value">${value}</div>
    <div class="stat-label">${label}</div>
  </div>`;
}

function fmt(n) {
  if (n === null || n === undefined || n === '') return '—';
  n = Number(n);
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
  if (n >= 1000)    return (n/1000).toFixed(1) + 'K';
  return String(n);
}
function fmtKb(kb) {
  if (!kb) return '—';
  if (kb >= 1048576) return (kb/1048576).toFixed(1) + ' GB';
  if (kb >= 1024)    return (kb/1024).toFixed(1) + ' MB';
  return kb + ' KB';
}

// ── Delete ────────────────────────────────────────────────────
async function deleteProfile(username) {
  if (!confirm(`Remove "${username}" from the database?`)) return;
  try {
    const { success, message } = await (await fetch(`${API}/profiles/${username}`, { method: 'DELETE' })).json();
    if (success) { showToast(`"${username}" removed.`, 'success'); document.getElementById('profileResult').classList.add('hidden'); }
    else showToast(message, 'error');
  } catch { showToast('Delete failed.', 'error'); }
}

// ── Export JSON ───────────────────────────────────────────────
async function exportProfileJson(username) {
  try {
    showToast(`⏳ Preparing JSON for @${username}...`, 'success');
    const res = await fetch(`${API}/profiles/${encodeURIComponent(username)}`);
    const json = await res.json();
    if (!json.success || !json.data) {
      showToast('Failed to retrieve profile for export.', 'error');
      return;
    }
    const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}_profile_gitlens.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 JSON downloaded successfully.', 'success');
  } catch (err) {
    showToast('JSON Export failed.', 'error');
  }
}

// ── Export CSV ────────────────────────────────────────────────
async function exportProfileCsv(username) {
  try {
    showToast(`⏳ Preparing CSV for @${username}...`, 'success');
    const res = await fetch(`${API}/profiles/${encodeURIComponent(username)}`);
    const json = await res.json();
    if (!json.success || !json.data) {
      showToast('Failed to retrieve profile for export.', 'error');
      return;
    }

    const d = json.data;
    const CSV_KEYS = [
      { label: 'Username', key: 'username' },
      { label: 'Name', key: 'name' },
      { label: 'Contribution Score', key: 'contribution_score' },
      { label: 'Most Used Language', key: 'most_used_language' },
      { label: 'Total Stars', key: 'total_stars' },
      { label: 'Average Stars/Repo', key: 'avg_stars_per_repo' },
      { label: 'Total Forks', key: 'total_forks' },
      { label: 'Public Repositories', key: 'public_repos' },
      { label: 'Original Repos', key: 'original_repos_count' },
      { label: 'Forked Repos', key: 'fork_repos_count' },
      { label: 'Followers', key: 'followers' },
      { label: 'Following', key: 'following' },
      { label: 'Account Age (Days)', key: 'account_age_days' },
      { label: 'Total Repo Size (KB)', key: 'total_size_kb' },
      { label: 'Open Issues', key: 'total_open_issues' },
      { label: 'Bio', key: 'bio' },
      { label: 'Company', key: 'company' },
      { label: 'Blog', key: 'blog' },
      { label: 'Location', key: 'location' },
      { label: 'Twitter', key: 'twitter_username' },
      { label: 'Hireable', key: 'hireable', fn: val => val ? 'Yes' : 'No' },
      { label: 'Profile README', key: 'has_profile_readme', fn: val => val ? 'Yes' : 'No' },
      { label: 'Organizations', key: 'organizations', fn: val => Array.isArray(val) ? val.map(o => o.login).join('; ') : '' },
      { label: 'Social Accounts', key: 'social_accounts', fn: val => Array.isArray(val) ? val.map(s => `${s.provider}:${s.url}`).join('; ') : '' },
      { label: 'GitHub URL', key: 'github_profile_url' },
      { label: 'Created At', key: 'github_created_at' },
      { label: 'Analyzed At', key: 'analyzed_at' }
    ];

    const escapeCsvCell = val => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = CSV_KEYS.map(k => escapeCsvCell(k.label)).join(',');
    const row = CSV_KEYS.map(k => {
      let val = d[k.key];
      if (k.fn) {
        val = k.fn(val);
      }
      return escapeCsvCell(val);
    }).join(',');

    const csvContent = headers + '\n' + row;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${username}_profile_gitlens.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📥 CSV downloaded successfully.', 'success');
  } catch (err) {
    showToast('CSV Export failed.', 'error');
  }
}

// ── Profiles List ─────────────────────────────────────────────
async function loadProfiles(page = 1) {
  currentPage = page;
  const sort  = document.getElementById('profileSort')?.value  || 'analyzed_at';
  const order = document.getElementById('profileOrder')?.value || 'DESC';
  const grid  = document.getElementById('profilesGrid');
  const pag   = document.getElementById('pagination');
  grid.innerHTML = skeletonCards(6);

  try {
    const res  = await fetch(`${API}/profiles?page=${page}&limit=12&sort=${sort}&order=${order}`);
    const json = await res.json();

    if (!json.success || !json.data?.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/></svg>
        <p>No profiles analyzed yet</p><small>Search a GitHub username or URL above</small>
      </div>`;
      pag.innerHTML = '';
      return;
    }

    grid.innerHTML = json.data.map(profileCard).join('');
    renderPagination(json.pagination);
  } catch {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Failed to load profiles</p></div>`;
  }
}

function profileCard(d) {
  const tier = getTier(d.contribution_score || 0);
  return `
  <div class="profile-card" onclick="openProfileModal('${d.username}')" id="pc-${d.username}">
    <div class="pc-top">
      <img src="${d.avatar_url || ''}" alt="${d.username}" class="pc-avatar" />
      <div>
        <div class="pc-name">${d.name || d.username}</div>
        <div class="pc-login">@${d.username}</div>
        <div class="pc-score">${tier.emoji} ${tier.name} · ${d.contribution_score || 0} pts</div>
      </div>
    </div>
    <div class="pc-stats">
      <div class="pc-stat"><div class="pc-stat-val">${fmt(d.public_repos)}</div><div class="pc-stat-label">Repos</div></div>
      <div class="pc-stat"><div class="pc-stat-val">${fmt(d.followers)}</div><div class="pc-stat-label">Followers</div></div>
      <div class="pc-stat"><div class="pc-stat-val">${fmt(d.total_stars)}</div><div class="pc-stat-label">Stars</div></div>
    </div>
    ${d.most_used_language ? `<div class="pc-lang"><div class="lang-dot"></div>${d.most_used_language}</div>` : ''}
  </div>`;
}

function skeletonCards(n) {
  return Array.from({length:n}, () => `
    <div class="profile-card">
      <div class="pc-top">
        <div class="skeleton" style="width:52px;height:52px;border-radius:50%"></div>
        <div style="flex:1"><div class="skeleton" style="height:14px;width:70%;margin-bottom:6px"></div><div class="skeleton" style="height:10px;width:50%"></div></div>
      </div>
      <div class="skeleton" style="height:40px;margin-top:12px;border-radius:8px"></div>
    </div>`).join('');
}

function renderPagination({ total, page, limit, pages }) {
  const pag = document.getElementById('pagination');
  if (pages <= 1) { pag.innerHTML = ''; return; }
  let html = `<button class="page-btn ${page<=1?'disabled':''}" onclick="loadProfiles(${page-1})">‹</button>`;
  for (let i = 1; i <= pages; i++) {
    if (i===1||i===pages||(i>=page-1&&i<=page+1)) {
      html += `<button class="page-btn ${i===page?'active':''}" onclick="loadProfiles(${i})">${i}</button>`;
    } else if (i===page-2||i===page+2) {
      html += `<span style="color:var(--text-3);padding:0 4px">…</span>`;
    }
  }
  html += `<button class="page-btn ${page>=pages?'disabled':''}" onclick="loadProfiles(${page+1})">›</button>`;
  pag.innerHTML = html;
}

// ── Profile Modal ─────────────────────────────────────────────
async function openProfileModal(username) {
  const overlay = document.getElementById('modalOverlay');
  const body    = document.getElementById('modalBody');
  overlay.classList.remove('hidden');
  body.innerHTML = `<div style="text-align:center;padding:48px"><div class="loader-spinner" style="margin:0 auto"></div></div>`;
  try {
    const json = await (await fetch(`${API}/profiles/${username}`)).json();
    body.innerHTML = json.success ? buildProfileHTML(json.data) : `<div class="empty-state"><p>${json.message}</p></div>`;
  } catch {
    body.innerHTML = `<div class="empty-state"><p>Failed to load profile</p></div>`;
  }
}
function closeModal() { document.getElementById('modalOverlay').classList.add('hidden'); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Leaderboard ───────────────────────────────────────────────
async function loadLeaderboard() {
  const metric = document.getElementById('lbMetric')?.value || 'contribution_score';
  const limit  = document.getElementById('lbLimit')?.value  || 10;
  const list   = document.getElementById('leaderboardList');
  list.innerHTML = Array.from({length:5}, () => `
    <div class="lb-item"><div class="skeleton" style="width:48px;height:48px;border-radius:50%"></div>
    <div style="flex:1"><div class="skeleton" style="height:14px;width:60%;margin-bottom:6px"></div><div class="skeleton" style="height:10px;width:40%"></div></div></div>`).join('');

  const LABELS = {
    contribution_score: '🎯 GitLens Score', total_stars: '⭐ Stars',
    followers: '👥 Followers', public_repos: '📦 Repos', total_forks: '🍴 Forks',
  };

  try {
    const json = await (await fetch(`${API}/leaderboard?metric=${metric}&limit=${limit}`)).json();
    if (!json.success || !json.data?.length) {
      list.innerHTML = `<div class="empty-state"><p>No data — analyze some profiles first!</p></div>`;
      return;
    }
    list.innerHTML = json.data.map((item, idx) => {
      const rank = idx + 1;
      const cls  = rank===1 ? 'gold' : rank===2 ? 'silver' : rank===3 ? 'bronze' : 'normal';
      const lbl  = rank===1 ? '🥇' : rank===2 ? '🥈' : rank===3 ? '🥉' : `#${rank}`;
      const tier = getTier(item.contribution_score || 0);
      return `
      <div class="lb-item" onclick="openProfileModal('${item.username}')">
        <div class="lb-rank ${cls}">${lbl}</div>
        <img src="${item.avatar_url||''}" alt="${item.username}" class="lb-avatar" />
        <div class="lb-info">
          <div class="lb-name">${tier.emoji} ${item.username}</div>
          <div class="lb-login">${item.most_used_language || '—'}</div>
        </div>
        <div class="lb-metric">
          <div class="lb-metric-val">${fmt(item[metric])}</div>
          <div class="lb-metric-label">${LABELS[metric] || metric}</div>
        </div>
      </div>`;
    }).join('');
  } catch {
    list.innerHTML = `<div class="empty-state"><p>Failed to load leaderboard</p></div>`;
  }
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const stack = document.getElementById('toastStack');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type==='success'?'✅':'❌'}</span><span>${msg}</span>`;
  stack.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'all 0.3s ease';
    t.style.opacity = '0';
    t.style.transform = 'translateX(120%)';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

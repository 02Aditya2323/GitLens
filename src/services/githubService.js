const axios = require('axios');
require('dotenv').config();

const GITHUB_API = 'https://api.github.com';

// ─── Token validation ────────────────────────────────────────────────────────
function isValidToken(t) {
  if (!t || typeof t !== 'string') return false;
  const s = t.trim();
  return (
    /^ghp_[A-Za-z0-9]{36,}$/.test(s)   ||
    /^gho_[A-Za-z0-9]{36,}$/.test(s)   ||
    /^ghs_[A-Za-z0-9]{36,}$/.test(s)   ||
    /^github_pat_[A-Za-z0-9_]{82,}$/.test(s) ||
    /^[0-9a-f]{40}$/.test(s)
  );
}

const token    = process.env.GITHUB_TOKEN;
const useToken = isValidToken(token);

if (token && !useToken) {
  console.warn('⚠️  GITHUB_TOKEN looks like a placeholder — ignored. Using unauthenticated access (60 req/hr).');
} else if (useToken) {
  console.log('🔑 GitHub token active — authenticated API access (5000 req/hr).');
} else {
  console.log('ℹ️  No GITHUB_TOKEN set. Using unauthenticated API access (60 req/hr).');
}

const mkClient = (withAuth) =>
  axios.create({
    baseURL: GITHUB_API,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(withAuth && useToken ? { Authorization: `Bearer ${token.trim()}` } : {}),
    },
    timeout: 15000,
  });

const client        = mkClient(true);
const clientNoAuth  = mkClient(false);

/** Core GET with automatic 401-retry without token */
async function ghGet(path, params = {}) {
  try {
    const { data } = await client.get(path, { params });
    return data;
  } catch (err) {
    if (err.response?.status === 401 && useToken) {
      console.warn('⚠️  GitHub 401 — token rejected. Retrying without token…');
      const { data } = await clientNoAuth.get(path, { params });
      return data;
    }
    throw err;
  }
}

// ─── Individual fetchers ─────────────────────────────────────────────────────

async function fetchUser(username) {
  return ghGet(`/users/${username}`);
}

async function fetchAllRepos(username) {
  let page = 1, all = [];
  while (true) {
    const batch = await ghGet(`/users/${username}/repos`, {
      per_page: 100, page, sort: 'updated', type: 'owner',
    });
    if (!batch.length) break;
    all = all.concat(batch);
    if (batch.length < 100 || ++page > 5) break;
  }
  return all;
}

async function fetchOrgs(username) {
  try {
    const data = await ghGet(`/users/${username}/orgs`, { per_page: 10 });
    return data.map(o => ({
      login: o.login,
      avatar_url: o.avatar_url,
      description: o.description || null,
      url: `https://github.com/${o.login}`,
    }));
  } catch { return []; }
}

async function fetchSocialAccounts(username) {
  try { return await ghGet(`/users/${username}/social_accounts`); }
  catch { return []; }
}

async function fetchRecentEvents(username) {
  try { return await ghGet(`/users/${username}/events`, { per_page: 100 }); }
  catch { return []; }
}

async function checkProfileReadme(username) {
  try { await ghGet(`/repos/${username}/${username}/readme`); return true; }
  catch { return false; }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMySQLDate(iso) {
  if (!iso) return null;
  return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
}

function summarizeEvents(events) {
  if (!events?.length) return null;
  const types = {}, repoSet = new Set();
  let lastActiveAt = null;
  for (const e of events) {
    types[e.type] = (types[e.type] || 0) + 1;
    if (e.repo?.name) repoSet.add(e.repo.name);
    if (e.created_at && (!lastActiveAt || e.created_at > lastActiveAt)) lastActiveAt = e.created_at;
  }
  return {
    total_events: events.length,
    event_types: types,
    active_repos: [...repoSet].slice(0, 15),
    last_active_at: lastActiveAt,
  };
}

function calcContributionScore({ totalStars, followers, publicRepos, totalForks,
  hasProfileReadme, orgs, socialAccounts, events }) {
  let s = 0;
  s += Math.min(400, Math.round(Math.log10(totalStars + 1)   * 100));
  s += Math.min(300, Math.round(Math.log10(followers + 1)    * 100));
  s += Math.min(150, Math.round(Math.log10(publicRepos + 1)  * 75));
  s += Math.min(100, Math.round(Math.log10(totalForks + 1)   * 40));
  if (hasProfileReadme) s += 20;
  s += Math.min(30, orgs.length * 5);
  s += Math.min(25, socialAccounts.length * 5);
  if (events?.length) s += Math.min(50, Math.round(events.length / 2));
  return Math.min(1000, s);
}

// ─── Main analysis ────────────────────────────────────────────────────────────

async function analyzeGitHubUser(username) {
  // Fire all requests in parallel
  const [user, repos, orgs, socialAccounts, events, hasProfileReadme] = await Promise.all([
    fetchUser(username),
    fetchAllRepos(username),
    fetchOrgs(username),
    fetchSocialAccounts(username),
    fetchRecentEvents(username),
    checkProfileReadme(username),
  ]);

  // ── Repo aggregates ──────────────────────────────────────────
  const totalStars        = repos.reduce((s, r) => s + r.stargazers_count,  0);
  const totalForks        = repos.reduce((s, r) => s + r.forks_count,       0);
  const totalWatchers     = repos.reduce((s, r) => s + r.watchers_count,    0);
  const totalOpenIssues   = repos.reduce((s, r) => s + (r.open_issues_count || 0), 0);
  const totalSizeKb       = repos.reduce((s, r) => s + (r.size || 0),       0);
  const forkReposCount    = repos.filter(r => r.fork).length;
  const originalReposCount = repos.filter(r => !r.fork).length;
  const avgStarsPerRepo   = repos.length ? Math.round((totalStars / repos.length) * 100) / 100 : 0;

  // ── Language breakdown ────────────────────────────────────────
  const langMap = {};
  for (const r of repos) if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1;
  const languagesBreakdown = Object.fromEntries(
    Object.entries(langMap).sort(([, a], [, b]) => b - a)
  );
  const mostUsedLanguage = Object.keys(languagesBreakdown)[0] || null;

  // ── Topics aggregation ────────────────────────────────────────
  const topicMap = {};
  for (const r of repos)
    for (const t of (r.topics || []))
      topicMap[t] = (topicMap[t] || 0) + 1;
  const allTopics = Object.entries(topicMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 30)
    .map(([t]) => t);

  // ── Top 10 repos by stars ─────────────────────────────────────
  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 10)
    .map(r => ({
      name:        r.name,
      full_name:   r.full_name,
      description: r.description,
      stars:       r.stargazers_count,
      forks:       r.forks_count,
      watchers:    r.watchers_count,
      open_issues: r.open_issues_count,
      language:    r.language,
      topics:      r.topics || [],
      url:         r.html_url,
      is_fork:     r.fork,
      size_kb:     r.size,
      created_at:  r.created_at,
      updated_at:  r.updated_at,
    }));

  // ── Account age ───────────────────────────────────────────────
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)
  );

  // ── Contribution score ────────────────────────────────────────
  const contributionScore = calcContributionScore({
    totalStars, followers: user.followers, publicRepos: user.public_repos,
    totalForks, hasProfileReadme, orgs, socialAccounts, events,
  });

  return {
    username:            user.login,
    name:                user.name,
    avatar_url:          user.avatar_url,
    bio:                 user.bio,
    company:             user.company,
    blog:                user.blog,
    location:            user.location,
    email:               user.email,
    twitter_username:    user.twitter_username,
    public_repos:        user.public_repos,
    public_gists:        user.public_gists,
    followers:           user.followers,
    following:           user.following,
    total_stars:         totalStars,
    total_forks:         totalForks,
    total_watchers:      totalWatchers,
    most_used_language:  mostUsedLanguage,
    top_repos:           topRepos,
    languages_breakdown: languagesBreakdown,
    account_age_days:    accountAgeDays,
    github_created_at:   formatMySQLDate(user.created_at),
    github_updated_at:   formatMySQLDate(user.updated_at),
    hireable:            user.hireable   || false,
    site_admin:          user.site_admin || false,
    // ── v2 fields ─────────────────────────────────────────────
    social_accounts:        socialAccounts,
    organizations:          orgs,
    recent_events_summary:  summarizeEvents(events),
    all_topics:             allTopics,
    avg_stars_per_repo:     avgStarsPerRepo,
    has_profile_readme:     hasProfileReadme,
    total_open_issues:      totalOpenIssues,
    total_size_kb:          totalSizeKb,
    fork_repos_count:       forkReposCount,
    original_repos_count:   originalReposCount,
    github_profile_url:     `https://github.com/${user.login}`,
    contribution_score:     contributionScore,
  };
}

module.exports = { analyzeGitHubUser };

const { pool } = require('../config/db');

const JSON_COLS = [
  'top_repos', 'languages_breakdown',
  'social_accounts', 'organizations', 'recent_events_summary', 'all_topics',
];

function parseJsonCols(row) {
  for (const col of JSON_COLS) {
    if (typeof row[col] === 'string') {
      try { row[col] = JSON.parse(row[col]); } catch { row[col] = null; }
    }
  }
  return row;
}

// ─── Upsert ──────────────────────────────────────────────────────────────────
async function upsertProfile(d) {
  const sql = `
    INSERT INTO github_profiles (
      username, name, avatar_url, bio, company, blog, location, email,
      twitter_username, public_repos, public_gists, followers, following,
      total_stars, total_forks, total_watchers, most_used_language,
      top_repos, languages_breakdown, account_age_days,
      github_created_at, github_updated_at, hireable, site_admin,
      social_accounts, organizations, recent_events_summary, all_topics,
      avg_stars_per_repo, has_profile_readme, total_open_issues, total_size_kb,
      fork_repos_count, original_repos_count, github_profile_url, contribution_score,
      analyzed_at
    ) VALUES (
      ?,?,?,?,?,?,?,?,
      ?,?,?,?,?,
      ?,?,?,?,
      ?,?,?,
      ?,?,?,?,
      ?,?,?,?,
      ?,?,?,?,
      ?,?,?,?,
      NOW()
    )
    ON DUPLICATE KEY UPDATE
      name=VALUES(name), avatar_url=VALUES(avatar_url), bio=VALUES(bio),
      company=VALUES(company), blog=VALUES(blog), location=VALUES(location),
      email=VALUES(email), twitter_username=VALUES(twitter_username),
      public_repos=VALUES(public_repos), public_gists=VALUES(public_gists),
      followers=VALUES(followers), following=VALUES(following),
      total_stars=VALUES(total_stars), total_forks=VALUES(total_forks),
      total_watchers=VALUES(total_watchers), most_used_language=VALUES(most_used_language),
      top_repos=VALUES(top_repos), languages_breakdown=VALUES(languages_breakdown),
      account_age_days=VALUES(account_age_days),
      github_created_at=VALUES(github_created_at), github_updated_at=VALUES(github_updated_at),
      hireable=VALUES(hireable), site_admin=VALUES(site_admin),
      social_accounts=VALUES(social_accounts), organizations=VALUES(organizations),
      recent_events_summary=VALUES(recent_events_summary), all_topics=VALUES(all_topics),
      avg_stars_per_repo=VALUES(avg_stars_per_repo), has_profile_readme=VALUES(has_profile_readme),
      total_open_issues=VALUES(total_open_issues), total_size_kb=VALUES(total_size_kb),
      fork_repos_count=VALUES(fork_repos_count), original_repos_count=VALUES(original_repos_count),
      github_profile_url=VALUES(github_profile_url), contribution_score=VALUES(contribution_score),
      analyzed_at=NOW()
  `;

  const values = [
    d.username, d.name, d.avatar_url, d.bio, d.company, d.blog, d.location, d.email,
    d.twitter_username, d.public_repos, d.public_gists, d.followers, d.following,
    d.total_stars, d.total_forks, d.total_watchers, d.most_used_language,
    JSON.stringify(d.top_repos), JSON.stringify(d.languages_breakdown), d.account_age_days,
    d.github_created_at, d.github_updated_at, d.hireable ? 1 : 0, d.site_admin ? 1 : 0,
    JSON.stringify(d.social_accounts), JSON.stringify(d.organizations),
    JSON.stringify(d.recent_events_summary), JSON.stringify(d.all_topics),
    d.avg_stars_per_repo, d.has_profile_readme ? 1 : 0,
    d.total_open_issues, d.total_size_kb, d.fork_repos_count, d.original_repos_count,
    d.github_profile_url, d.contribution_score,
  ];

  const [result] = await pool.query(sql, values);
  return result;
}

// ─── List all profiles (paginated) ───────────────────────────────────────────
async function getAllProfiles({ page = 1, limit = 20, sort = 'analyzed_at', order = 'DESC' } = {}) {
  const ALLOWED_SORTS   = ['analyzed_at','followers','total_stars','public_repos','username',
                            'updated_at','contribution_score','total_open_issues','account_age_days'];
  const ALLOWED_ORDERS  = ['ASC','DESC'];
  const safeSort  = ALLOWED_SORTS.includes(sort)   ? sort            : 'analyzed_at';
  const safeOrder = ALLOWED_ORDERS.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
  const offset    = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT id, username, name, avatar_url, bio, location,
            public_repos, followers, following, total_stars, total_forks,
            most_used_language, account_age_days, hireable, has_profile_readme,
            contribution_score, original_repos_count, fork_repos_count,
            avg_stars_per_repo, total_open_issues, github_profile_url,
            analyzed_at, updated_at
     FROM github_profiles
     ORDER BY ${safeSort} ${safeOrder}
     LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)]
  );

  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM github_profiles');
  return {
    data: rows,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
  };
}

// ─── Single profile (full data) ───────────────────────────────────────────────
async function getProfileByUsername(username) {
  const [rows] = await pool.query(
    'SELECT * FROM github_profiles WHERE username = ?',
    [username.toLowerCase()]
  );
  return rows.length ? parseJsonCols(rows[0]) : null;
}

// ─── Delete ───────────────────────────────────────────────────────────────────
async function deleteProfile(username) {
  const [result] = await pool.query(
    'DELETE FROM github_profiles WHERE username = ?',
    [username.toLowerCase()]
  );
  return result.affectedRows > 0;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
async function getLeaderboard(metric = 'total_stars', limit = 10) {
  const ALLOWED = ['total_stars','followers','public_repos','total_forks',
                   'account_age_days','contribution_score','total_open_issues'];
  const safeMetric = ALLOWED.includes(metric) ? metric : 'total_stars';

  const [rows] = await pool.query(
    `SELECT username, name, avatar_url, ${safeMetric}, most_used_language,
            contribution_score, has_profile_readme, analyzed_at
     FROM github_profiles
     ORDER BY ${safeMetric} DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows;
}

// ─── Stats summary ────────────────────────────────────────────────────────────
async function getDbStats() {
  const [[stats]] = await pool.query(`
    SELECT
      COUNT(*) AS total_profiles,
      SUM(total_stars) AS total_stars_tracked,
      SUM(followers) AS total_followers_tracked,
      AVG(contribution_score) AS avg_score,
      MAX(contribution_score) AS top_score,
      SUM(public_repos) AS total_repos_tracked
    FROM github_profiles
  `);
  return stats;
}

module.exports = { upsertProfile, getAllProfiles, getProfileByUsername, deleteProfile, getLeaderboard, getDbStats };

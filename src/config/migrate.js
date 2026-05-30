const { pool } = require('../config/db');

const CREATE_DB_SQL = 'CREATE DATABASE IF NOT EXISTS `github_analyzer`';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS github_profiles (
  id                    INT             NOT NULL AUTO_INCREMENT,
  username              VARCHAR(100)    NOT NULL,
  name                  VARCHAR(200),
  avatar_url            TEXT,
  bio                   TEXT,
  company               VARCHAR(200),
  blog                  VARCHAR(300),
  location              VARCHAR(200),
  email                 VARCHAR(200),
  twitter_username      VARCHAR(100),
  public_repos          INT             NOT NULL DEFAULT 0,
  public_gists          INT             NOT NULL DEFAULT 0,
  followers             INT             NOT NULL DEFAULT 0,
  following             INT             NOT NULL DEFAULT 0,
  total_stars           INT             NOT NULL DEFAULT 0,
  total_forks           INT             NOT NULL DEFAULT 0,
  total_watchers        INT             NOT NULL DEFAULT 0,
  most_used_language    VARCHAR(100),
  top_repos             JSON,
  languages_breakdown   JSON,
  account_age_days      INT             NOT NULL DEFAULT 0,
  github_created_at     DATETIME,
  github_updated_at     DATETIME,
  hireable              TINYINT(1)      NOT NULL DEFAULT 0,
  site_admin            TINYINT(1)      NOT NULL DEFAULT 0,
  -- v2 enrichment columns
  social_accounts       JSON,
  organizations         JSON,
  recent_events_summary JSON,
  all_topics            JSON,
  avg_stars_per_repo    DECIMAL(8,2)    NOT NULL DEFAULT 0,
  has_profile_readme    TINYINT(1)      NOT NULL DEFAULT 0,
  total_open_issues     INT             NOT NULL DEFAULT 0,
  total_size_kb         INT             NOT NULL DEFAULT 0,
  fork_repos_count      INT             NOT NULL DEFAULT 0,
  original_repos_count  INT             NOT NULL DEFAULT 0,
  github_profile_url    VARCHAR(300),
  contribution_score    INT             NOT NULL DEFAULT 0,
  -- timestamps
  analyzed_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_username        (username),
  KEY idx_followers             (followers DESC),
  KEY idx_total_stars           (total_stars DESC),
  KEY idx_analyzed_at           (analyzed_at DESC),
  KEY idx_contribution_score    (contribution_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// Columns added in v2 — safe to run on existing tables
const V2_COLUMNS = [
  ['social_accounts',       'JSON'],
  ['organizations',         'JSON'],
  ['recent_events_summary', 'JSON'],
  ['all_topics',            'JSON'],
  ['avg_stars_per_repo',    'DECIMAL(8,2) NOT NULL DEFAULT 0'],
  ['has_profile_readme',    'TINYINT(1) NOT NULL DEFAULT 0'],
  ['total_open_issues',     'INT NOT NULL DEFAULT 0'],
  ['total_size_kb',         'INT NOT NULL DEFAULT 0'],
  ['fork_repos_count',      'INT NOT NULL DEFAULT 0'],
  ['original_repos_count',  'INT NOT NULL DEFAULT 0'],
  ['github_profile_url',    'VARCHAR(300)'],
  ['contribution_score',    'INT NOT NULL DEFAULT 0'],
];

let migrationsRun = false;

async function runMigrations() {
  if (migrationsRun) return true;

  try {
    const mysql = require('mysql2/promise');
    require('dotenv').config();

    // Create DB using a temporary connection without a selected database
    const tmp = await mysql.createConnection({
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 3306,
      user:     process.env.DB_USER     || 'root',
      password: process.env.DB_PASSWORD || '',
    });
    await tmp.query(CREATE_DB_SQL);
    console.log('✅ Database `github_analyzer` ensured');
    await tmp.end();

    // Create table (full schema for fresh installs)
    await pool.query(CREATE_TABLE_SQL);
    console.log('✅ Table `github_profiles` ensured');

    // Add v2 columns for existing installs (ER_DUP_FIELDNAME = already exists, safe to skip)
    for (const [col, def] of V2_COLUMNS) {
      try {
        await pool.query(`ALTER TABLE github_profiles ADD COLUMN ${col} ${def}`);
        console.log(`  ➕ Column '${col}' added`);
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
          console.warn(`  ⚠️  Could not add column '${col}':`, err.message);
        }
      }
    }

    // Add contribution_score index if missing
    try {
      await pool.query('ALTER TABLE github_profiles ADD KEY idx_contribution_score (contribution_score DESC)');
    } catch { /* already exists */ }

    migrationsRun = true;
    return true;
  } catch (err) {
    console.warn('⚠️  Migration failed / MySQL not ready:', err.message);
    return false;
  }
}

module.exports = { runMigrations };

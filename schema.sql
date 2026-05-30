-- ============================================================
-- GitLens — GitHub Profile Analyzer v2
-- Database Schema Export
-- ============================================================

CREATE DATABASE IF NOT EXISTS `github_analyzer`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `github_analyzer`;

CREATE TABLE IF NOT EXISTS `github_profiles` (
  `id`                    INT             NOT NULL AUTO_INCREMENT,
  `username`              VARCHAR(100)    NOT NULL,
  `name`                  VARCHAR(200)    DEFAULT NULL,
  `avatar_url`            TEXT            DEFAULT NULL,
  `bio`                   TEXT            DEFAULT NULL,
  `company`               VARCHAR(200)    DEFAULT NULL,
  `blog`                  VARCHAR(300)    DEFAULT NULL,
  `location`              VARCHAR(200)    DEFAULT NULL,
  `email`                 VARCHAR(200)    DEFAULT NULL,
  `twitter_username`      VARCHAR(100)    DEFAULT NULL,

  -- Core profile metrics
  `public_repos`          INT             NOT NULL DEFAULT 0,
  `public_gists`          INT             NOT NULL DEFAULT 0,
  `followers`             INT             NOT NULL DEFAULT 0,
  `following`             INT             NOT NULL DEFAULT 0,

  -- Repo aggregates
  `total_stars`           INT             NOT NULL DEFAULT 0,
  `total_forks`           INT             NOT NULL DEFAULT 0,
  `total_watchers`        INT             NOT NULL DEFAULT 0,
  `total_open_issues`     INT             NOT NULL DEFAULT 0,
  `total_size_kb`         INT             NOT NULL DEFAULT 0,
  `fork_repos_count`      INT             NOT NULL DEFAULT 0,
  `original_repos_count`  INT             NOT NULL DEFAULT 0,
  `avg_stars_per_repo`    DECIMAL(8,2)    NOT NULL DEFAULT 0,

  -- Language & topic analysis
  `most_used_language`    VARCHAR(100)    DEFAULT NULL,
  `languages_breakdown`   JSON            DEFAULT NULL COMMENT 'Map of language -> repo count',
  `all_topics`            JSON            DEFAULT NULL COMMENT 'Ranked list of all topics from repos',

  -- Top repos
  `top_repos`             JSON            DEFAULT NULL COMMENT 'Top 10 repos by star count',

  -- Social & community
  `social_accounts`       JSON            DEFAULT NULL COMMENT 'GitHub social_accounts API response',
  `organizations`         JSON            DEFAULT NULL COMMENT 'Public org memberships',

  -- Activity
  `recent_events_summary` JSON            DEFAULT NULL COMMENT 'Summary of last 100 public events',

  -- Profile metadata
  `has_profile_readme`    TINYINT(1)      NOT NULL DEFAULT 0,
  `github_profile_url`    VARCHAR(300)    DEFAULT NULL,
  `account_age_days`      INT             NOT NULL DEFAULT 0,
  `github_created_at`     DATETIME        DEFAULT NULL,
  `github_updated_at`     DATETIME        DEFAULT NULL,
  `hireable`              TINYINT(1)      NOT NULL DEFAULT 0,
  `site_admin`            TINYINT(1)      NOT NULL DEFAULT 0,

  -- GitLens computed score (0–1000)
  `contribution_score`    INT             NOT NULL DEFAULT 0,

  -- Record timestamps
  `analyzed_at`           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_username`             (`username`),
  KEY `idx_followers`                  (`followers` DESC),
  KEY `idx_total_stars`                (`total_stars` DESC),
  KEY `idx_analyzed_at`                (`analyzed_at` DESC),
  KEY `idx_contribution_score`         (`contribution_score` DESC)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='GitLens analyzed GitHub developer profiles';

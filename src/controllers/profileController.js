const { analyzeGitHubUser } = require('../services/githubService');
const {
  upsertProfile, getAllProfiles, getProfileByUsername,
  deleteProfile, getLeaderboard, getDbStats,
} = require('../models/profileModel');
const { extractGitHubUsername } = require('../utils/githubParser');

// ─── Shared analysis logic ────────────────────────────────────────────────────
async function _runAnalysis(username, res) {
  try {
    const analysis = await analyzeGitHubUser(username);
    await upsertProfile(analysis);
    return res.status(200).json({
      success: true,
      message: `Profile for "${analysis.username}" analyzed and stored successfully.`,
      data: analysis,
    });
  } catch (err) {
    if (err.response?.status === 404)
      return res.status(404).json({ success: false, message: `GitHub user "${username}" not found.` });
    if (err.response?.status === 401)
      return res.status(401).json({
        success: false,
        message: 'GitHub API returned 401 Unauthorized. Remove or replace the GITHUB_TOKEN in .env.',
      });
    if (err.response?.status === 403)
      return res.status(429).json({
        success: false,
        message: 'GitHub API rate limit exceeded. Add a valid GITHUB_TOKEN in .env (5000 req/hr).',
      });
    console.error('analyzeProfile error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.', error: err.message });
  }
}

// ── POST /api/analyze/:username  (plain username OR URL-encoded GitHub URL) ───
async function analyzeProfile(req, res) {
  const raw      = decodeURIComponent(req.params.username || '');
  const username = extractGitHubUsername(raw);
  if (!username)
    return res.status(400).json({
      success: false,
      message: 'Invalid input. Provide a GitHub username or a full GitHub profile URL.',
    });
  return _runAnalysis(username, res);
}

// ── POST /api/analyze  (body: { input: "username OR url" }) ──────────────────
async function analyzeProfileByInput(req, res) {
  const raw      = String(req.body?.input || req.body?.username || req.body?.url || '');
  const username = extractGitHubUsername(raw);
  if (!username)
    return res.status(400).json({
      success: false,
      message: 'Provide { "input": "torvalds" } or { "input": "https://github.com/torvalds" }.',
    });
  return _runAnalysis(username, res);
}

// ── GET /api/profiles ─────────────────────────────────────────────────────────
async function listProfiles(req, res) {
  try {
    const { page = 1, limit = 20, sort = 'analyzed_at', order = 'DESC' } = req.query;
    return res.status(200).json({ success: true, ...(await getAllProfiles({ page, limit, sort, order })) });
  } catch (err) {
    console.error('listProfiles error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── GET /api/profiles/:username ───────────────────────────────────────────────
async function getProfile(req, res) {
  try {
    const profile = await getProfileByUsername(req.params.username);
    if (!profile)
      return res.status(404).json({
        success: false,
        message: `Profile "${req.params.username}" not found. Analyze it first.`,
      });
    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.error('getProfile error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── DELETE /api/profiles/:username ────────────────────────────────────────────
async function removeProfile(req, res) {
  try {
    const deleted = await deleteProfile(req.params.username);
    if (!deleted) return res.status(404).json({ success: false, message: 'Profile not found.' });
    return res.status(200).json({ success: true, message: `Profile "${req.params.username}" deleted.` });
  } catch (err) {
    console.error('removeProfile error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── GET /api/leaderboard ──────────────────────────────────────────────────────
async function leaderboard(req, res) {
  try {
    const { metric = 'total_stars', limit = 10 } = req.query;
    const data = await getLeaderboard(metric, limit);
    return res.status(200).json({ success: true, metric, data });
  } catch (err) {
    console.error('leaderboard error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// ── GET /api/stats ────────────────────────────────────────────────────────────
async function stats(req, res) {
  try {
    const data = await getDbStats();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('stats error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

module.exports = {
  analyzeProfile, analyzeProfileByInput,
  listProfiles, getProfile, removeProfile,
  leaderboard, stats,
};

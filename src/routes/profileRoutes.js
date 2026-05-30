const express = require('express');
const router  = express.Router();
const {
  analyzeProfile, analyzeProfileByInput,
  listProfiles, getProfile, removeProfile,
  leaderboard, stats,
} = require('../controllers/profileController');

/**
 * @route  POST /api/analyze
 * @desc   Analyze via JSON body — accepts username OR full GitHub URL
 * @body   { "input": "torvalds" }  OR  { "input": "https://github.com/torvalds" }
 */
router.post('/analyze', analyzeProfileByInput);

/**
 * @route  POST /api/analyze/:username
 * @desc   Analyze via URL param — accepts plain username OR URL-encoded GitHub URL
 */
router.post('/analyze/:username', analyzeProfile);

/**
 * @route  GET /api/profiles
 * @query  page, limit, sort (analyzed_at|followers|total_stars|public_repos|contribution_score), order (ASC|DESC)
 */
router.get('/profiles', listProfiles);

/**
 * @route  GET /api/profiles/:username
 * @desc   Full profile data including JSON fields
 */
router.get('/profiles/:username', getProfile);

/**
 * @route  DELETE /api/profiles/:username
 */
router.delete('/profiles/:username', removeProfile);

/**
 * @route  GET /api/leaderboard
 * @query  metric (total_stars|followers|public_repos|total_forks|contribution_score), limit
 */
router.get('/leaderboard', leaderboard);

/**
 * @route  GET /api/stats
 * @desc   Aggregate stats across all stored profiles
 */
router.get('/stats', stats);

module.exports = router;

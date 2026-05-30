/**
 * Extracts a valid GitHub username from either:
 *   - A plain username:           "torvalds"
 *   - A full GitHub URL:          "https://github.com/torvalds"
 *   - A partial URL:              "github.com/torvalds"
 *   - URL with trailing slash:    "https://github.com/torvalds/"
 *
 * Returns the username string, or null if the input is invalid.
 */
function extractGitHubUsername(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // Match GitHub profile URLs
  const urlMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9][a-zA-Z0-9-]{0,37}[a-zA-Z0-9]?)\/?(?:[?#].*)?$/
  );
  if (urlMatch) return urlMatch[1];

  // Single-char username (also valid)
  if (/^[a-zA-Z0-9]$/.test(trimmed)) return trimmed;

  // Plain username (1–39 chars, alphanumeric + hyphens, no leading/trailing hyphen)
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]{0,37}[a-zA-Z0-9]?$/.test(trimmed)) return trimmed;

  return null;
}

module.exports = { extractGitHubUsername };

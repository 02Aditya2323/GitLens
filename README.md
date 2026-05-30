# 🔭 GitLens — GitHub Profile Analyzer

> A full-stack Node.js + Express + MySQL application that analyzes any GitHub developer profile, computes rich insights by hitting the GitHub Public API, stores everything in a relational database, and presents it in a stunning dark-themed frontend.

![Tech Stack](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white)
![GitHub API](https://img.shields.io/badge/GitHub%20API-v3-181717?logo=github)
![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20JS-F7DF1E?logo=javascript&logoColor=black)

-## ✨ Features

| Feature | Details |
|---|---|
| **Analyze any GitHub user** | POST to `/api/analyze/:username` — fetches profile + all repos |
| **Rich Insights Stored** | Public repos, followers, following, total ⭐ stars, total 🍴 forks, watchers, gists |
| **Language Breakdown** | Ranked map of languages used across all repos |
| **Top 10 Repositories** | By star count — name, description, language, topics, URL |
| **Account Age** | Computed in days from `created_at` |
| **Upsert Logic** | Re-analyzing updates the existing record (no duplicates) |
| **Paginated List API** | `GET /api/profiles` with sort, order, page, limit |
| **Single Profile API** | `GET /api/profiles/:username` — full data incl. JSON fields |
| **Delete API** | `DELETE /api/profiles/:username` |
| **Leaderboard API** | `GET /api/leaderboard?metric=total_stars&limit=10` |
| **Interactive API Docs** | Full OpenAPI 3.0 specs served via Swagger UI at `/api-docs` |
| **One-Click Exports** | Download flat Excel-friendly CSV sheets or full JSON payloads instantly |
| **Stunning Frontend** | Dark glassmorphism UI, animated orbs, skeleton loaders, toasts |
| **Token Support** | Set `GITHUB_TOKEN` for 5000 req/hr instead of 60 |

---

## 🗂 Project Structure

```
GithubAssignemnt/
├── src/
│   ├── server.js                  # Express entry point
│   ├── config/
│   │   ├── db.js                  # MySQL connection pool
│   │   ├── migrate.js             # Auto-create DB + tables on boot
│   │   └── swagger.js             # [NEW] OpenAPI 3.0 / Swagger specification
│   ├── routes/
│   │   └── profileRoutes.js       # Route definitions
│   ├── controllers/
│   │   └── profileController.js   # Request handlers
│   ├── services/
│   │   └── githubService.js       # GitHub API calls + aggregation
│   └── models/
│       └── profileModel.js        # All SQL queries
├── public/
│   ├── index.html                 # Frontend SPA
│   ├── style.css                  # Full design system (updated with exports)
│   └── app.js                     # Vanilla JS app logic (updated with exports)
├── schema.sql                     # Database schema export
├── GitLens.postman_collection.json
├── .env.example
├── .gitignore
├── package.json
```

---

## ⚙️ Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd GithubAssignemnt
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=github_analyzer

# Optional but recommended (5000 req/hr vs 60)
GITHUB_TOKEN=ghp_your_personal_access_token
```

> **Getting a GitHub Token**: GitHub → Settings → Developer Settings → Personal access tokens → Fine-grained tokens → Generate (no scopes needed for public data)

### 3. Start MySQL

Make sure MySQL is running locally (already installed per assignment).

```bash
# macOS (Homebrew)
brew services start mysql

# Or if using system MySQL
sudo mysql.server start
```

> **Note**: The app auto-creates the `github_analyzer` database and `github_profiles` table on first startup — you don't need to run any SQL manually.

### 4. Start the Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

You'll see:

```
✅ MySQL connected successfully
✅ Database `github_analyzer` ensured
✅ Table `github_profiles` ensured

🚀 GitHub Profile Analyzer API running at http://localhost:5000
🌐 Frontend:       http://localhost:5000
📖 API Docs:       http://localhost:5000/api-docs
🔍 API Health:     http://localhost:5000/api/health
```

### 5. Open the Frontend

Navigate to **http://localhost:5000** in your browser.

---

## 📖 Interactive API Docs

GitLens includes a fully compliant OpenAPI 3.0 interactive specification. Once the server is booted, open your browser and navigate to:

👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)** (or port `8080` if set via env)

This interactive UI allows you to inspect all schemas, parameters, and request/response shapes, as well as test all 8 API endpoints directly from your browser!

---

## 📤 Developer Profile Exports

Users can instantly download analyzed profile records directly from the frontend dashboard (available on the active search result view and inside the profile details modal):

1. **JSON Payload**: Downloads the exact, full profile JSON hierarchy matching the database payload (`[username]_profile_gitlens.json`).
2. **CSV Flat Sheet**: Downloads a flattened, parsed CSV table representing 27 core metrics (including organizations and social links concatenated as clean semicolon-separated values) tailored perfectly for importing into Microsoft Excel or Google Sheets (`[username]_profile_gitlens.csv`).

---

## 🔌 API Reference

Base URL: `http://localhost:5000/api`

### `GET /health`
Health check — verifies the server is alive.

---

### `POST /analyze/:username`
Fetch a GitHub profile, compute insights, and store in DB.

```bash
curl -X POST http://localhost:5000/api/analyze/torvalds
```

**Response:**
```json
{
  "success": true,
  "message": "Profile for \"torvalds\" analyzed and stored successfully.",
  "data": {
    "username": "torvalds",
    "name": "Linus Torvalds",
    "public_repos": 6,
    "followers": 230000,
    "total_stars": 212000,
    "most_used_language": "C",
    "languages_breakdown": { "C": 4, "Perl": 1 },
    "top_repos": [...],
    "account_age_days": 5700,
    ...
  }
}
```

---

### `GET /profiles`
List all stored profiles (paginated).

| Query Param | Default | Options |
|---|---|---|
| `page` | `1` | integer |
| `limit` | `20` | integer |
| `sort` | `analyzed_at` | `analyzed_at`, `followers`, `total_stars`, `public_repos`, `username` |
| `order` | `DESC` | `ASC`, `DESC` |

```bash
curl "http://localhost:5000/api/profiles?sort=total_stars&limit=5"
```

---

### `GET /profiles/:username`
Full data for a single stored profile.

```bash
curl http://localhost:5000/api/profiles/torvalds
```

---

### `DELETE /profiles/:username`
Remove a profile from the database.

```bash
curl -X DELETE http://localhost:5000/api/profiles/torvalds
```

---

### `GET /leaderboard`
Top developers ranked by a chosen metric.

| Query Param | Default | Options |
|---|---|---|
| `metric` | `total_stars` | `total_stars`, `followers`, `public_repos`, `total_forks`, `account_age_days` |
| `limit` | `10` | integer |

```bash
curl "http://localhost:5000/api/leaderboard?metric=followers&limit=5"
```

---

## 🗄 Database Schema

See [`schema.sql`](./schema.sql) for the full export.

**Key columns in `github_profiles`:**

| Column | Type | Description |
|---|---|---|
| `username` | VARCHAR(100) UNIQUE | GitHub login |
| `public_repos` | INT | Number of public repos |
| `followers` | INT | Follower count |
| `total_stars` | INT | Aggregate stars across all repos |
| `total_forks` | INT | Aggregate forks |
| `most_used_language` | VARCHAR(100) | Top language by repo count |
| `languages_breakdown` | JSON | `{ "Python": 12, "JS": 8, ... }` |
| `top_repos` | JSON | Top 10 repos by stars |
| `account_age_days` | INT | Days since account creation |
| `analyzed_at` | DATETIME | Last analysis timestamp |

---

## 📮 Postman Collection

Import [`GitLens.postman_collection.json`](./GitLens.postman_collection.json) into Postman.

Set the `base_url` variable to `http://localhost:5000` and `username` to any GitHub handle.

---

## 🤝 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: MySQL 8.x via `mysql2/promise`
- **HTTP Client**: Axios (GitHub API calls)
- **Frontend**: Vanilla HTML/CSS/JS (no frameworks, no bundler)
- **Design**: Dark glassmorphism, Inter + JetBrains Mono fonts, CSS animations

---

## 📝 License

MIT

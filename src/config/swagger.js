const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'GitLens — GitHub Profile Analyzer API',
    version: '1.0.0',
    description: 'Deep-dive developer profiling API utilizing the GitHub public API and storing analytics in a MySQL database. Features include automated scoring, organization tracking, star & fork calculations, and database-wide aggregates/leaderboards.',
    contact: {
      name: 'GitLens Dev Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Default Local Development Server (Port 5000)',
    },
    {
      url: 'http://localhost:8080',
      description: 'Alternative Port / Production Server',
    },
  ],
  components: {
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully.' },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string', format: 'date-time', example: '2026-05-30T12:00:00.000Z' },
          service: { type: 'string', example: 'GitHub Profile Analyzer API' },
          version: { type: 'string', example: '1.0.0' },
        },
      },
      AnalyzeRequest: {
        type: 'object',
        required: ['input'],
        properties: {
          input: {
            type: 'string',
            description: 'A GitHub username or a full GitHub profile URL.',
            example: 'torvalds',
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 45 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 12 },
          pages: { type: 'integer', example: 4 },
        },
      },
      GitHubRepo: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'linux' },
          description: { type: 'string', example: 'Linux kernel source tree' },
          url: { type: 'string', example: 'https://github.com/torvalds/linux' },
          stars: { type: 'integer', example: 168432 },
          forks: { type: 'integer', example: 48931 },
          language: { type: 'string', example: 'C' },
        },
      },
      SocialAccount: {
        type: 'object',
        properties: {
          provider: { type: 'string', example: 'twitter' },
          url: { type: 'string', example: 'https://twitter.com/torvalds' },
        },
      },
      Organization: {
        type: 'object',
        properties: {
          login: { type: 'string', example: 'linuxfoundation' },
          url: { type: 'string', example: 'https://api.github.com/orgs/linuxfoundation' },
          avatar_url: { type: 'string', example: 'https://avatars.githubusercontent.com/u/1234' },
          description: { type: 'string', example: 'The Linux Foundation' },
        },
      },
      RecentActivitySummary: {
        type: 'object',
        properties: {
          last_active_at: { type: 'string', format: 'date-time', example: '2026-05-30T10:45:00Z' },
          active_repos: {
            type: 'array',
            items: { type: 'string' },
            example: ['torvalds/linux', 'torvalds/pesign'],
          },
          event_types: {
            type: 'object',
            additionalProperties: { type: 'integer' },
            example: { PushEvent: 12, CreateEvent: 1, IssueCommentEvent: 3 },
          },
        },
      },
      GitHubProfile: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'torvalds' },
          name: { type: 'string', example: 'Linus Torvalds' },
          avatar_url: { type: 'string', example: 'https://avatars.githubusercontent.com/u/1024?v=4' },
          bio: { type: 'string', example: 'Creator of Linux and Git' },
          company: { type: 'string', example: 'The Linux Foundation' },
          blog: { type: 'string', example: 'https://linuxfoundation.org' },
          location: { type: 'string', example: 'Portland, OR' },
          email: { type: 'string', nullable: true, example: 'torvalds@linux-foundation.org' },
          twitter_username: { type: 'string', nullable: true, example: 'torvalds' },
          public_repos: { type: 'integer', example: 6 },
          public_gists: { type: 'integer', example: 0 },
          followers: { type: 'integer', example: 215430 },
          following: { type: 'integer', example: 0 },
          total_stars: { type: 'integer', example: 172900 },
          total_forks: { type: 'integer', example: 49822 },
          total_watchers: { type: 'integer', example: 172900 },
          most_used_language: { type: 'string', example: 'C' },
          top_repos: {
            type: 'array',
            items: { $ref: '#/components/schemas/GitHubRepo' },
          },
          languages_breakdown: {
            type: 'object',
            additionalProperties: { type: 'integer' },
            example: { C: 4, Perl: 1, Shell: 1 },
          },
          account_age_days: { type: 'integer', example: 5420 },
          github_created_at: { type: 'string', format: 'date-time', example: '2011-09-03T15:25:00Z' },
          github_updated_at: { type: 'string', format: 'date-time', example: '2026-05-28T09:12:00Z' },
          hireable: { type: 'integer', example: 0 },
          site_admin: { type: 'integer', example: 0 },
          social_accounts: {
            type: 'array',
            items: { $ref: '#/components/schemas/SocialAccount' },
          },
          organizations: {
            type: 'array',
            items: { $ref: '#/components/schemas/Organization' },
          },
          recent_events_summary: {
            $ref: '#/components/schemas/RecentActivitySummary',
          },
          all_topics: {
            type: 'array',
            items: { type: 'string' },
            example: ['linux', 'kernel', 'git', 'c-programming'],
          },
          avg_stars_per_repo: { type: 'number', format: 'float', example: 28816.67 },
          has_profile_readme: { type: 'integer', example: 1 },
          total_open_issues: { type: 'integer', example: 8 },
          total_size_kb: { type: 'integer', example: 5410940 },
          fork_repos_count: { type: 'integer', example: 1 },
          original_repos_count: { type: 'integer', example: 5 },
          github_profile_url: { type: 'string', example: 'https://github.com/torvalds' },
          contribution_score: { type: 'integer', example: 980 },
          analyzed_at: { type: 'string', format: 'date-time', example: '2026-05-30T12:00:00Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-05-30T12:00:00Z' },
        },
      },
      ProfileSummary: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'torvalds' },
          name: { type: 'string', example: 'Linus Torvalds' },
          avatar_url: { type: 'string', example: 'https://avatars.githubusercontent.com/u/1024?v=4' },
          bio: { type: 'string', example: 'Creator of Linux and Git' },
          location: { type: 'string', example: 'Portland, OR' },
          public_repos: { type: 'integer', example: 6 },
          followers: { type: 'integer', example: 215430 },
          following: { type: 'integer', example: 0 },
          total_stars: { type: 'integer', example: 172900 },
          total_forks: { type: 'integer', example: 49822 },
          most_used_language: { type: 'string', example: 'C' },
          account_age_days: { type: 'integer', example: 5420 },
          hireable: { type: 'integer', example: 0 },
          has_profile_readme: { type: 'integer', example: 1 },
          contribution_score: { type: 'integer', example: 980 },
          original_repos_count: { type: 'integer', example: 5 },
          fork_repos_count: { type: 'integer', example: 1 },
          avg_stars_per_repo: { type: 'number', format: 'float', example: 28816.67 },
          total_open_issues: { type: 'integer', example: 8 },
          github_profile_url: { type: 'string', example: 'https://github.com/torvalds' },
          analyzed_at: { type: 'string', format: 'date-time', example: '2026-05-30T12:00:00Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-05-30T12:00:00Z' },
        },
      },
      StatsData: {
        type: 'object',
        properties: {
          total_profiles: { type: 'integer', example: 8 },
          total_stars_tracked: { type: 'integer', example: 198420 },
          total_followers_tracked: { type: 'integer', example: 220130 },
          avg_score: { type: 'number', format: 'float', example: 412.5 },
          top_score: { type: 'integer', example: 980 },
          total_repos_tracked: { type: 'integer', example: 42 },
        },
      },
      LeaderboardItem: {
        type: 'object',
        properties: {
          username: { type: 'string', example: 'torvalds' },
          name: { type: 'string', example: 'Linus Torvalds' },
          avatar_url: { type: 'string', example: 'https://avatars.githubusercontent.com/u/1024?v=4' },
          contribution_score: { type: 'integer', example: 980 },
          total_stars: { type: 'integer', example: 172900 },
          followers: { type: 'integer', example: 215430 },
          public_repos: { type: 'integer', example: 6 },
          total_forks: { type: 'integer', example: 49822 },
          most_used_language: { type: 'string', example: 'C' },
          has_profile_readme: { type: 'integer', example: 1 },
          analyzed_at: { type: 'string', format: 'date-time', example: '2026-05-30T12:00:00Z' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Check service and database status',
        description: 'Returns the health status of the GitLens profile analyzer service.',
        tags: ['System'],
        responses: {
          200: {
            description: 'API is healthy and online.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/analyze': {
      post: {
        summary: 'Analyze and store profile (JSON Request)',
        description: 'Analyzes a GitHub developer by username or profile URL and registers/updates the profile analytics in the database.',
        tags: ['Profiling'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AnalyzeRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile successfully analyzed and upserted.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Profile for "torvalds" analyzed and stored successfully.' },
                    data: { $ref: '#/components/schemas/GitHubProfile' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid search input.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          404: {
            description: 'GitHub user not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          429: {
            description: 'GitHub public API rate limit exceeded.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          503: {
            description: 'Database is offline.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
        },
      },
    },
    '/api/analyze/{username}': {
      post: {
        summary: 'Analyze and store profile (URL parameter)',
        description: 'Analyzes a GitHub developer by username or URL-encoded profile URL in the path and registers/updates the profile in the database.',
        tags: ['Profiling'],
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            description: 'A GitHub username or an encoded profile URL (e.g. `https%3A%2F%2Fgithub.com%2Ftorvalds`).',
            schema: { type: 'string' },
            example: 'torvalds',
          },
        ],
        responses: {
          200: {
            description: 'Profile successfully analyzed and upserted.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Profile for "torvalds" analyzed and stored successfully.' },
                    data: { $ref: '#/components/schemas/GitHubProfile' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid input in path parameter.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          404: {
            description: 'GitHub user not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          429: {
            description: 'GitHub public API rate limit exceeded.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          503: {
            description: 'Database is offline.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
        },
      },
    },
    '/api/profiles': {
      get: {
        summary: 'List all analyzed profiles (Paginated)',
        description: 'Retrieves a list of profiles currently registered in the database, ordered by metrics.',
        tags: ['Analytics'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Page index to fetch.',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 20 },
            description: 'Maximum number of items per page.',
          },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'analyzed_at', 'followers', 'total_stars', 'public_repos',
                'username', 'updated_at', 'contribution_score',
                'total_open_issues', 'account_age_days'
              ],
              default: 'analyzed_at',
            },
            description: 'Field to sort profiles by.',
          },
          {
            name: 'order',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['ASC', 'DESC'],
              default: 'DESC',
            },
            description: 'Sorting direction.',
          },
        ],
        responses: {
          200: {
            description: 'A paginated list of profile summaries.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ProfileSummary' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          503: {
            description: 'Database is offline.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
        },
      },
    },
    '/api/profiles/{username}': {
      get: {
        summary: 'Get single profile full details',
        description: 'Retrieves a single fully analyzed developer profile with all details (JSON structures, languages, orgs, social accounts).',
        tags: ['Analytics'],
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            description: 'The GitHub username of the profile.',
            schema: { type: 'string' },
            example: 'torvalds',
          },
        ],
        responses: {
          200: {
            description: 'Profile details found.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/GitHubProfile' },
                  },
                },
              },
            },
          },
          404: {
            description: 'Profile not found in database.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          503: {
            description: 'Database is offline.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete profile record',
        description: 'Deletes a developer profile record from the tracking database.',
        tags: ['Analytics'],
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            description: 'The GitHub username of the profile to delete.',
            schema: { type: 'string' },
            example: 'torvalds',
          },
        ],
        responses: {
          200: {
            description: 'Profile successfully deleted.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          404: {
            description: 'Profile not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          503: {
            description: 'Database is offline.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
        },
      },
    },
    '/api/leaderboard': {
      get: {
        summary: 'Get leaderboard rankings',
        description: 'Retrieves top profiles ranked by a specific metric.',
        tags: ['Leaderboard'],
        parameters: [
          {
            name: 'metric',
            in: 'query',
            schema: {
              type: 'string',
              enum: [
                'contribution_score', 'total_stars', 'followers',
                'public_repos', 'total_forks', 'account_age_days',
                'total_open_issues'
              ],
              default: 'contribution_score',
            },
            description: 'Metric used to rank the developers.',
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 10 },
            description: 'Maximum number of items to return.',
          },
        ],
        responses: {
          200: {
            description: 'Leaderboard list found.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    metric: { type: 'string', example: 'contribution_score' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/LeaderboardItem' },
                    },
                  },
                },
              },
            },
          },
          503: {
            description: 'Database is offline.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
        },
      },
    },
    '/api/stats': {
      get: {
        summary: 'Get database aggregate statistics',
        description: 'Retrieves sums, maximums, and averages computed across all developer records currently tracked.',
        tags: ['Analytics'],
        responses: {
          200: {
            description: 'Aggregate stats returned.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/StatsData' },
                  },
                },
              },
            },
          },
          503: {
            description: 'Database is offline.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: [], // No dynamic JSDoc loading required since schemas are statically declared above for 100% environment reliability
};

module.exports = swaggerJSDoc(options);

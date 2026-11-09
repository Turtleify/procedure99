# Blueprint

A gamified desktop app (Electron + React + TypeScript) for learning system design a few minutes a day.

## Run it

```bash
npm install
npm run dev        # hot-reloading dev mode
npm run build      # production bundles into out/
npm start          # run the built app
npm test           # content sanity + game-logic tests
npm run typecheck
npm run dist       # Windows installer in dist/ (recommended for daily use)
```

Use the installed build (`npm run dist`) for real daily use. It registers a proper Start Menu shortcut, which Windows needs for reliable notifications. It also gives you a stable launch-at-login entry that doesn't point into `node_modules`.

## What's inside

| Area | What it does |
|---|---|
| **Path** | 9 units following the video: servers and the 3 failures → requirements → monolith/microservices and scaling → request flow, load balancers, stateless → data modeling and SQL vs NoSQL → indexes → caching → replication and sharding → capstone. Each unit has concept-card lessons with quizzes, **Interview Bytes** (write an answer, compare it to a model answer, self-grade) and 4 **hands-on Docker labs** (Nginx LB, Postgres indexes, Redis cache-aside, Redis replication/failover). |
| **Toolbox** | 18 collectible tool cards (Nginx, HAProxy, ALB, Postgres, MongoDB, Cassandra, DynamoDB, Redis, Kafka…) with strengths, weaknesses, and when to use or avoid each. Also 12 head-to-head tradeoff tables. Each unlocks when you finish its unit. |
| **Tradeoff Arena** | 35 real-world scenarios. Pick the right tool or approach, then read why every option is right or wrong. |
| **Review** | Leitner spaced repetition. Every quiz question you answer comes back on a 1/2/4/8/16/32-day schedule. |

### Daily hooks
- Daily XP goal, a 🔥 streak, and ❄️ streak freezes. You earn a freeze every 7 days, and each one auto-covers a missed day.
- 3 daily quests and a reward chest.
- A Daily Incident: one scenario per day, one attempt.
- Levels, achievements, a 17-week activity heatmap.
- **Settings → Startup & reminders** (also in the tray menu):
  - **Tray + reminders**: launch hidden at login with a greeting toast.
  - **Open window at login**.
  - **Reminders only**.
  - **Off**.
- Reminders fire at your chosen time, plus a late-evening "streak in danger" alert.

## Where data lives
Progress is saved to `%APPDATA%/Blueprint/progress.json`.

## Dev/testing env vars
- `BLUEPRINT_USER_DATA=<dir>`: use a throwaway profile.
- `BLUEPRINT_NO_LOGIN_ITEM=1`: don't touch OS login items.
- `BLUEPRINT_SHOTS=<dir>`: screenshot every view, then quit.
- `BLUEPRINT_DEBUG=1`: forward renderer console output to the terminal.

## Adding content
Content is plain TypeScript in `src/renderer/src/content/`:
- `curriculum.ts`: units and lessons.
- `scenarios.ts`: arena and daily incidents.
- `tools.ts`: tool cards and comparisons.

`npm test` validates the content: answer indices in range, exactly one correct option per scenario, and valid unit references.

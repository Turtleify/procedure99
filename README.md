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
| **Design Lab** | LeetCode-style whiteboard problems (4 Easy, 5 Medium, 4 Hard: blog → URL shortener → news feed, chat, video). An Excalidraw-like canvas with real architecture shapes (clients, DNS, CDN, load balancer, API gateway, servers, workers, cache, SQL/NoSQL, object storage, search, queues). Drag shapes on, connect them with arrows, set how many copies run, then **Run checks** to test the design. Reference designs unlock when you solve a problem or after 3 runs. |
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

### Sound and music
- Background music plays on shuffle. Use the mute button and volume slider in the top bar. The default volume is 30% of the tracks' own level, and your setting is saved. Music pauses while Blueprint is hidden in the tray.
- Sound effects for clicks, hovers, right and wrong answers, and level-ups. Turn them on or off in **Settings → Window & sound**.

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
- `design-problems.ts`: Design Lab problems. Each has checks built from the helpers in `lib/design.ts` (`hasPath`, `hasEdge`, `instances`, `dbReplicated`…) and a reference design that must pass them all (enforced by `npm test`).

`npm test` validates the content: answer indices in range, exactly one correct option per scenario, and valid unit references.

## Music credits

The background music is from [Free To Use](https://freetouse.com/music). Files are in `blueprint-background-music/`.

| Track | Artist | Source |
|---|---|---|
| Moving Mountains | Aeris | [freetouse.com/music](https://freetouse.com/music) |
| Pure Dream | Aeris | [freetouse.com/music](https://freetouse.com/music) |
| Yellow Flower | Aeris | [freetouse.com/music](https://freetouse.com/music) |
| Fresh Start | Chill Pulse | [freetouse.com/music](https://freetouse.com/music) |
| A Sweet Story | Guillermo Guareschi | [freetouse.com/music](https://freetouse.com/music) |
| Loving | Pufino | [freetouse.com/music](https://freetouse.com/music) |

Music track: Moving Mountains by Aeris<br>
Music track: Pure Dream by Aeris<br>
Music track: Yellow Flower by Aeris<br>
Music track: Fresh Start by Chill Pulse<br>
Music track: A Sweet Story by Guillermo Guareschi<br>
Music track: Loving by Pufino<br>
Source: https://freetouse.com/music

To add a track, put the `.mp3` in `blueprint-background-music/`, add it to `TRACKS` in `src/renderer/src/lib/music.ts`, and credit it here.

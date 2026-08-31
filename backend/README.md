# gangster-bot-brain

The brain for Gangster Bot: Express + SQLite (`better-sqlite3`). Owns roles,
games, persona, sessions, and the message log. Talks to `gangster-bot-relay`
for all WhatsApp I/O and serves `gangster-bot-web` (the Next.js dashboard)
over a small admin API.

```
WhatsApp <--> gangster-bot-relay <--> gangster-bot-brain <--> gangster-bot-web
              (Puppeteer, dumb)        (this repo)              (dashboard UI)
                                        Express + SQLite
```

Three separate long-lived processes, ideally on the same box — SQLite is a
local file, so this only works cleanly as a single process/instance (no
horizontal scaling of the brain without switching to Postgres later).

## Why a separate process from the relay?

Puppeteer/whatsapp-web.js holds a fragile, singular session. Bot logic —
games, roles, persona — should be free to have bugs, slow queries, or
frequent redeploys without ever risking that session. Same box is fine
(and fast — localhost HTTP is <1ms), but different process.

## Identity model

- **WhatsApp users**: identified purely by phone number, no login. Role
  (`member`/`admin`/`super_admin`) is looked up per-message. Some numbers
  are hardcoded super-admins via `SUPER_ADMIN_PHONES` — not demotable from
  the dashboard, that's your break-glass access.
- **Dashboard access**: entirely separate — see `gangster-bot-web`'s README.
  Firebase Auth gates humans; this brain only trusts requests carrying a
  `DASHBOARD_API_KEYS` bearer token (i.e. "this came from our dashboard
  server"), not a specific human.

## API

### Public
- `GET /health`
- `POST /webhook/inbound` — called by the relay on every inbound WhatsApp
  message. Requires `x-webhook-secret` matching `RELAY_WEBHOOK_SECRET`.

### Dashboard (all require `Authorization: Bearer <DASHBOARD_API_KEYS>`)
- `GET/PATCH /api/admin/users` — list users, update role/ban
- `GET/PATCH /api/admin/games` — list games, toggle enabled
- `GET /api/admin/sessions` — recent game sessions
- `GET /api/admin/messages` — recent message log

## Player commands

- `welcome` / `hi` / `hello` — crew intro
- `rules` — house code
- `games` — list enabled games
- `play <id>` — start a game (`heist`, `dice`, `vault`, `riddle`, `trivia`, `showdown`, `scramble`, `race`)
- `quit` / `stop` / `cancel` — abandon the active game
- `stats` — wins / games played
- `name <nickname>` — set display name
- `help` — command menu
- Admin: `broadcast`, `promote` (same as before)

## Built-in games

| id | name | how it plays |
|---|---|---|
| `heist` | The Heist | 3-step caper: scout, crack, getaway |
| `dice` | High Roller | call high/low, roll 2d6 |
| `vault` | Vault Code | guess 1–100 in 7 tries |
| `riddle` | Street Riddles | 3 guesses |
| `trivia` | Street Smarts | 2 guesses |
| `showdown` | Showdown | rock / paper / scissors |
| `scramble` | Word Job | unscramble a word |
| `race` | Night Race | pick lane 1, 2, or 3 |

## Adding a game

One file. No other edits.

1. Copy `src/bot/games/_template.ts` to `src/bot/games/yourgame.ts`
   (the loader ignores files that start with `_`).
2. Fill in `id`, `name`, `description`, `start`, and `turn`.
   Use `defineGame` so state stays typed. `win()` / `lose()` / `next()`
   cover the usual turn results.
3. Restart `gangster-bot-brain`. The loader registers every Game export
   in that folder, upserts the dashboard row, and `play <id>` works.
   Optional `aliases` let people type `play caper` instead of `play heist`.

Helpers live in `src/bot/games/helpers.ts` (`who`, `pick`, `randInt`,
`normalize`, `matchChoice`, `triesLeft`). See `dice.ts` for a one-turn
game and `heist.ts` for a multi-step one.

## Running locally

```bash
cp .env.example .env
npm install
npm run dev
```

SQLite file is created automatically at `DB_PATH` on first run (schema
migration runs on import — see `src/db/connection.ts`).

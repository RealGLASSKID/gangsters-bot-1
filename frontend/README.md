# gangster-bot-web

Pure admin dashboard for Gangster Bot — Next.js, no business logic. Roles,
games, sessions, and the message log all live in `gangster-bot-brain`
(Express + SQLite); this app only renders them and calls back into that
service.

```
gangster-bot-relay  <-->  gangster-bot-brain  <-->  gangster-bot-web (this repo)
 (Puppeteer, dumb)         Express + SQLite           /dashboard UI only
```

## Two separate identity systems — don't conflate them

1. **WhatsApp phone-number roles** — owned entirely by the brain. This
   app never touches them directly.
2. **Dashboard login** — Firebase Auth (Google sign-in) gates who can see
   `/dashboard` at all. This app still owns this part; it's the only auth
   concern left here.

## Why the `/api/brain/[...path]` proxy exists

The brain's admin API expects a static `DASHBOARD_API_KEY` bearer token.
That key must never reach the browser. So the dashboard's client
components call `authedFetch("users")`, `authedFetch("games")`, etc. (see
`lib/firebase/useAuth.ts`), which hit this app's own
`/api/brain/[...path]` route — a thin server-side proxy that attaches the
real key and forwards to `BRAIN_URL`.

That proxy currently does **not** re-verify the Firebase ID token it
receives (there's no Firebase Admin SDK in this app anymore — that's the
whole point of this split). It trusts the dashboard layout's client-side
redirect-to-`/login` for UX gating. If you need a real server-side check
at that boundary, either bring back the Admin SDK just for token
verification, or verify the ID token's JWT against Firebase's public JWKS
directly (lighter weight, no service account needed for that alone).

## Running locally

```bash
cp .env.example .env.local   # Firebase client config + BRAIN_URL + DASHBOARD_API_KEY
npm install
npm run dev
```

Requires `gangster-bot-brain` running (see its README) at `BRAIN_URL`.

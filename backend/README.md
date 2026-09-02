# GANGSTER BOT — Phases 1–8

One WhatsApp number · one group · SQLite · TypeScript · Next.js dashboard

## Setup

```bash
cd backend
npm install
# edit src/config.ts → ownerJid + groupJid
npm run dev
```

Frontend (separate terminal):
```bash
cd frontend
npm install
npm run dev
```

## Identity

Anyone can run these in the group **or a DM** (no cooldown):

- `!me` — your PN JID (`@s.whatsapp.net`) and LID (`@lid`)
- `!group` — this group's JID + subject / size / addressing

Paste those into `OWNER_JID` and `GROUP_JID` (or `src/config.ts`).

## API (port 3001)
- GET /api/health
- GET /api/stats
- GET /api/leaderboard/xp|coins|rep
- GET /api/giveaway
- GET /api/commands

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

## API (port 4000 locally; Render sets `PORT`)
- GET /health
- GET /api/health
- GET /api/stats
- GET /api/leaderboard/xp|coins|rep
- GET /api/giveaway
- GET /api/commands

## Render + UptimeRobot

1. Push this repo and create a **Web Service** on [Render](https://dashboard.render.com) (or apply `render.yaml` as a Blueprint).
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build:** `npm install`
   - **Start:** `npm start`
   - **Health Check Path:** `/health`
3. Environment (same keys as `.env.example`). Render injects `PORT` — do not hardcode it. Keep `DASHBOARD_DEV_BYPASS=0` in production. `tsx` is a production dependency so `npm start` works after a production install.
4. Deploy, open the service URL, then scan the WhatsApp QR from Render logs or the dashboard session page.
5. **UptimeRobot:** add an HTTPS monitor on `https://YOUR-SERVICE.onrender.com/health`, interval **5 minutes**, keyword `ok` (optional). That ping stops the free instance from sleeping.
6. SQLite and Baileys auth live in `DATA_DIR` (default `./data`). Free disks are ephemeral — a restart/deploy can drop the WhatsApp session. For a persistent login, attach a Render disk and set `DATA_DIR` to the mount path (for example `/var/data`).

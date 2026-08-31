# gangster-bot-relay

A **dumb** WhatsApp send/receive relay for Gangster Bot, built on `whatsapp-web.js`.
It owns exactly one thing: the WhatsApp Web session. It has no database, no
conversation logic, no scheduling — that all lives in `gangster-bot-brain`.

## Why dumb?

`whatsapp-web.js` drives a headless Chromium tab tied to a single logged-in
phone number. That session is stateful, single-process, and fragile — it
can't be horizontally scaled and shouldn't share a process with anything
that might crash, block the event loop, or need frequent redeploys. So
this service's only job is to stay up and hold that connection.

```
WhatsApp  <-->  gangster-bot-relay  <-->  gangster-bot-brain  <-->  gangster-bot-web
                 (this repo)               Express + SQLite         Next.js dashboard
                 Puppeteer, dumb            roles, games, persona    (calls the brain)
```

- **Inbound**: relay receives a WhatsApp message → POSTs it to
  `BACKEND_URL + BACKEND_INBOUND_PATH` (the brain's `/webhook/inbound`)
  with an `x-webhook-secret` header the brain verifies.
- **Outbound**: the brain calls this relay's `POST /v1/send` (or `/v1/delete`)
  with a `Bearer` API key when it wants to message someone.

The env var is still named `BACKEND_URL` (not `BRAIN_URL`) because from
this relay's point of view, whatever's on the other end of that webhook
just *is* "the backend" — it doesn't need to know it's specifically the
brain service.

## API

All `/api/v1/*` routes require `Authorization: Bearer <key>` where `<key>`
is one of `RELAY_API_KEYS`.

### `POST /api/v1/send`
```json
{ "to": "2348012345678", "message": "hello" }
```

### `POST /api/v1/delete`
```json
{ "messageId": "true_234...@c.us_ABC...", "everyone": true }
```

### `GET /health`
No auth required. Returns WhatsApp connection status. Always 200 so
platforms like Railway don't restart-loop while you scan a QR code.

## Running locally

```bash
cp .env.example .env   # fill in RELAY_API_KEYS, BACKEND_URL (-> the brain), BACKEND_WEBHOOK_SECRET
npm install
npm run dev
```

On first run, a QR code prints to the terminal — scan it with WhatsApp
(Linked Devices) to authenticate. The session persists to
`WHATSAPP_SESSION_PATH` so you won't need to re-scan on every restart.

## Deploying

Needs a persistent disk for `WHATSAPP_SESSION_PATH` and a container with
Chromium available (set `PUPPETEER_EXECUTABLE_PATH` if using a system
install rather than the bundled one). Not suited to serverless/edge hosts
for the same reason it shouldn't share a process with the brain.

Run this alongside `gangster-bot-brain` on the same box for lowest latency
(their webhook/send calls are just localhost HTTP).

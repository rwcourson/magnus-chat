# Magnus Chat

Interactive **demo** of Magnus — Brasfield & Gorrie’s AI + intranet experience — built with Next.js. Flat glass UI, dual Home/Chat modes, feed, messages, Insights, and AI Gateway–powered replies (with offline knowledge fallbacks).

## Quick start

```bash
npm install
cp .env.example .env.local   # add AI_GATEWAY_API_KEY if you want live AI
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

See [`.env.example`](./.env.example).

| Variable | Purpose |
|----------|---------|
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway (live chat). Without it, mock knowledge replies still work. |
| `MAGNUS_MODEL` | Gateway model id, e.g. `google/gemma-4-31b-it` |
| `NEXT_PUBLIC_SITE_URL` | Absolute site origin for Open Graph / link previews (set in production) |
| `MAGNUS_AI_MOCK=1` | Force offline mock replies even when a key is set |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm test` | Seed + layout verification scripts |

## Stack

- Next.js 16 (App Router)
- React 19 · Tailwind CSS 4 · Framer Motion
- AI SDK 7 + Vercel AI Gateway
- TypeScript

## Deploy (Vercel · personal)

Repo: [github.com/rwcourson/magnus-chat](https://github.com/rwcourson/magnus-chat)

Production should set at least:

```bash
NEXT_PUBLIC_SITE_URL=https://<your-deployment>.vercel.app
AI_GATEWAY_API_KEY=<gateway key>   # optional but recommended for live AI
MAGNUS_MODEL=google/gemma-4-31b-it
```

## Notes

This is a **product demo** with rich local seed data (people, feed, channels, Insights). It is not a production B&G deployment.

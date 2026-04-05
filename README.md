# Ghost Tab

Private onchain pull-payments on MagicBlock and Solana Devnet.

Ghost Tab lets a sender open a recipient-bound spend session with:
- hidden reserve
- active allowance window
- recipient pull actions
- expiry and clawback path

Repository: [github.com/Pterodactyl681/GhostTab](https://github.com/Pterodactyl681/GhostTab/)

## Current Status

This repo is **live-beta** (not full production mainnet).

Implemented now:
- wallet connect flow (multi-wallet detection)
- create tab flow (live-beta path)
- recipient pull flow (live transfer when wallet-bound conditions match)
- inbox/outbox/all session filtering by connected wallet
- server-side live-beta persistence via JSON file store
- i18n routing (`en`, `ru`) with localized UI copy

Not fully finished yet:
- full autonomous onchain session lifecycle (native crank / PER end-to-end)
- production-grade persistent database (current store is file-based)

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS + shadcn/ui patterns
- next-intl localization
- Solana Devnet wallet integration
- MagicBlock Private Payments client layer

## Architecture

Core layers:
- Domain types: `lib/domain/*`
- Runtime env model: `lib/config/ghost-tab-env.ts`
- Service interface: `lib/services/ghost-tab-service.ts`
- Live adapter: `lib/services/adapters/magicblock-ghost-tab-service.ts`
- Demo adapter fallback: `lib/services/adapters/mock-ghost-tab-service.ts`
- MagicBlock payments client: `lib/services/magicblock/private-payments-client.ts`
- Live-beta persistence store: `lib/services/live/live-beta-session-store.ts`

## Routes

- `/{locale}` landing (`/en`, `/ru`)
- `/{locale}/app` sessions (All / Inbox / Outbox)
- `/{locale}/app/create` create flow
- `/{locale}/app/tab/[id]` tab detail
- `/{locale}/app/recipient/[id]` recipient action view
- `/{locale}/app/history` historical sessions
- `/{locale}/demo` demo board

## API Endpoints

- `POST /api/ghost-tab/create`
- `POST /api/ghost-tab/pull`
- `GET /api/ghost-tab/sessions`

## Environment

Copy `.env.example` to `.env.local` and fill values.

Required for live-beta mode:
- `NEXT_PUBLIC_MAGIC_ROUTER_DEVNET_URL`
- `NEXT_PUBLIC_MAGICBLOCK_PRIVATE_PAYMENTS_URL`

Optional/override:
- `NEXT_PUBLIC_GHOSTTAB_MODE=live|demo`
- `NEXT_PUBLIC_GHOSTTAB_ADAPTER=magicblock|mock` (legacy compatibility)
- `NEXT_PUBLIC_SOLANA_CLUSTER=devnet`
- `NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL=...`
- `NEXT_PUBLIC_MAGICBLOCK_TEE_HOOK=...`
- `NEXT_PUBLIC_MAGICBLOCK_PER_HOOK=...`

If required live env keys are missing, app falls back to demo mode by design.

## Local Run

### Windows one-command launcher (portable Node included)

```powershell
powershell -ExecutionPolicy Bypass -File .\run-ghosttab.ps1
```

Custom port:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-ghosttab.ps1 -Port 3000
```

### Standard npm

```bash
npm install
npm run dev -- -p 3101
```

Open:
- [http://localhost:3101/en](http://localhost:3101/en)
- [http://localhost:3101/ru](http://localhost:3101/ru)

## Quick Beta Test (Sender -> Recipient)

1. Connect sender wallet.
2. Open `/{locale}/app/create`.
3. Create tab with recipient as a real Solana wallet address.
4. Open created tab detail and recipient view.
5. Connect recipient wallet (must match configured recipient wallet).
6. Click `Pull now`.

Expected:
- session created successfully
- recipient pull accepted when allowance/time rules allow
- event tape updates
- transfer path is marked honestly (`live-transfer` vs `live-beta-shell`)

## Persistence

Live-beta sessions are persisted server-side to:

- `data/live-beta-sessions.json`

This solves:
- refresh survival
- server restart survival
- inbox/outbox not tied to a single browser tab lifetime

## Deployment Notes (Vercel)

You can deploy frontend/API to Vercel now for beta demos.

Important:
- Vercel serverless file system is ephemeral.
- `data/live-beta-sessions.json` is great locally/self-hosted Node, but not ideal for persistent cloud production behavior.

For durable cloud persistence, move session store to:
- SQLite/libSQL (Turso) or
- Postgres/Supabase/Neon

## Repository Structure

```text
app/
  [locale]/
    app/...
  api/ghost-tab/...
components/site/...
lib/
  config/
  domain/
  services/
messages/
```

## Product Truth

Ghost Tab in this repo is built to be explicit about status:
- live where live is real
- beta where behavior is hybrid
- demo fallback when env is incomplete

That honesty is intentional for judging, demos, and safe iteration.

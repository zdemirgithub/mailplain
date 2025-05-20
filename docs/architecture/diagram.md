# 🏗️ Architecture Diagram

## High-Level Overview

```
                       ┌──────────────┐
                       │   Frontend   │ (Next.js App Router)
                       └──────┬───────┘
                              │
                Clerk Auth    │  tRPC Client
                              ▼
                       ┌──────────────┐
                       │   Backend    │
                       │  (API Layer) │
                       └──────┬───────┘
                              │
               ┌─────────────┴─────────────┐
               ▼                           ▼
       ┌────────────┐              ┌─────────────┐
       │   tRPC     │              │ REST Routes │
       │ Routers    │              │ (/api/*)    │
       └────┬───────┘              └────┬────────┘
            │                            │
            ▼                            ▼
       ┌────────────┐              ┌──────────────┐
       │   Prisma   │              │ External APIs│
       │ (Postgres) │              │ (Aurinko etc)│
       └────┬───────┘              └──────────────┘
            │
            ▼
        PostgreSQL
```

## Internal Services

* `lib/` folder contains logic to interface with:

  * Aurinko Email API
  * Stripe Subscriptions
  * Clerk sessions (via middleware)

## Security Layers

* Clerk middleware for public/protected route separation
* tRPC protected procedures
* REST webhook signature checks

## Communication

* Webhook → REST API
* UI → tRPC
* Background jobs triggered via REST (e.g. `/api/initial-sync`)

## Deployment Target

* Vercel (static + SSR functions)

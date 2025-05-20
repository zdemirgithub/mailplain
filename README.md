# Mailplain

Mailplain is a modern, AI-powered email client built with **Next.js 14**, featuring real-time mail processing, third-party integrations (Aurinko, Stripe, OpenAI), and a secure role-based system backed by Clerk. This document serves as comprehensive technical documentation including setup, structure, architecture, APIs, and deployment.

---

## 🚀 Project Setup

### Clone & Install

```bash
git clone https://github.com/zdemirgithub/mailplain.git
cd mailplain
npm install
cp .env.example .env
```

### Run Locally

```bash
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_URL=http://localhost:3000

CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

AURINKO_CLIENT_ID=
AURINKO_CLIENT_SECRET=

OPENAI_API_KEY=
DATABASE_URL=
```

---

## 🧱 Project Structure

```
mailplain/
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # UI components
│   ├── lib/               # Business logic (Aurinko, Stripe, OpenAI)
│   ├── hooks/             # Custom React hooks
│   ├── server/            # tRPC routers and DB access
│   ├── styles/            # Global styles
│   ├── trpc/              # tRPC utils (context, router)
│   └── middleware.ts      # Clerk route protection middleware
│
├── prisma/                # Prisma schema + migrations
├── public/                # Public static assets
├── cypress/               # Cypress e2e tests
├── .env.example           # Environment config
└── README.md
```

---

## 📐 Architecture Diagram

```
     +--------------+      +---------------+
     |   Frontend   | <--> |  Next.js App  |
     | (React/Tail) |      |   (API + UI)  |
     +--------------+      +---------------+
            |                      |
            v                      v
    Clerk (Auth)          tRPC Routers (Server)
            |                      |
            v                      v
  Stripe <--> Webhooks <--> Business Logic (lib)
            |                      |
            v                      v
         OpenAI                Aurinko (Mail API)
            |                      |
            v                      v
        Role/Auth           Prisma + Neon DB
```

---

## 📦 Feature Overview

* **Authentication:** Clerk (JWT, RBAC)
* **Subscriptions:** Stripe (Webhook + Limits)
* **Mail Integration:** Aurinko API
* **AI Summaries:** OpenAI Completion API
* **Email Parsing:** Custom logic via `lib/aurinko.ts`
* **File Storage:** AWS S3 (via SDK)
* **Search Engine:** Pinecone (semantic email search)

---

## 📚 Technical API Reference

### 🔹 tRPC API (Server Only)

**Mail Router**

* `listAccounts()` → List all connected email accounts
* `sendMail({to, subject, body})` → Send new email
* `syncMail()` → Trigger a full sync

**Webhooks Router**

* `getWebhooks({ accountId })` → List active webhooks
* `createWebhook({ accountId, notificationUrl })` → Register new webhook
* `deleteWebhook({ accountId, webhookId })` → Remove webhook

**Search Router**

* `search({ query })` → Semantic full-text search over mail using Pinecone

### 🔹 REST Webhooks

* `POST /api/stripe/webhook`

  * Stripe payment and subscription webhook handler

* `POST /api/aurinko/webhook`

  * Handles new email events from Aurinko

---

## 🔎 Tests

**Unit Tests:** `src/__tests__/unit`

* Isolated logic: middleware, utility functions, auth

**Integration Tests:** `src/__tests__/integration`

* API calls, DB queries, multi-module workflows

**E2E Tests:** `cypress/e2e`

* Simulate user login, dashboard navigation, Stripe payment

---

## ☁️ Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git remote add origin https://github.com/yourname/mailplain.git
git push -u origin main
```

### 2. Connect to Vercel

* Go to [vercel.com](https://vercel.com)
* Import project from GitHub
* Set environment variables

### 3. Configure Webhooks

* **Stripe:** Dashboard → Webhooks → Add endpoint `https://yourdomain.com/api/stripe/webhook`
* **Aurinko:** Auth during email setup triggers internal `/api/aurinko/webhook`

---

## 🧠 Contributors Guide

* Prefer tRPC over REST for internal APIs
* Use Clerk's `auth()` in server-only environments
* Follow consistent error handling using `try/catch` and `zod`
* All PRs should include unit or integration tests

---

## 📌 License

MIT

---

For issues, contact [zdemirgithub](https://github.com/zdemirgithub).

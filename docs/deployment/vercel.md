# 🚀 Deployment Guide: Vercel

This guide helps you deploy the project to [Vercel](https://vercel.com).

---

## ✅ Requirements

* Vercel account
* GitHub (or GitLab/Bitbucket) repository with the project code
* Environment variables (see below)

---

## 1. 📁 Project Setup

1. Push your project to GitHub.
2. Go to [vercel.com/import](https://vercel.com/import) and import your GitHub repository.
3. Vercel will auto-detect the Next.js app.
4. Set the **Framework Preset** to **Next.js**.

---

## 2. 🔐 Environment Variables

Set these in your Vercel project dashboard under **Settings → Environment Variables**:

```
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
CLERK_JWT_KEY=
NEXT_PUBLIC_CLERK_FRONTEND_API=
NEXT_PUBLIC_URL=https://your-domain.vercel.app
DATABASE_URL=postgresql://user:password@host:port/db
AURINKO_CLIENT_ID=
AURINKO_CLIENT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
```

Use `vercel env pull` to sync `.env` locally.

---

## 3. 🔧 Build & Output Settings

* **Build Command:** `next build`
* **Output Directory:** `.vercel/output`
* **Install Command:** `yarn install`
* **Development Command:** `yarn dev`

---

## 4. 🌍 Custom Domain

1. Go to **Vercel → Domains**.
2. Add your domain (e.g. `mailplain.com`).
3. Update your DNS records.

---

## 5. ✅ Final Steps

* Enable GitHub auto-deploys
* Set up monitoring (e.g. Vercel Analytics or Sentry)
* Test Stripe and Aurinko webhooks with their test modes

---

## 📦 Output

* Serverless deployment with Vercel Edge and Function regions
* Optimized Next.js static + SSR rendering

---

> If you encounter issues, check Vercel logs or run `vercel logs [deployment-url]`.

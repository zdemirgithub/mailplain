
---

# Developer Guide

## Overview

This project is a fully featured AI-powered email client built using **Next.js 14**. It offers subscription-based premium features with billing and payment handled through **Stripe**. The backend processes events using Stripe webhooks, and the app leverages a modern tech stack focused on scalability, security, and developer productivity.

## Technologies and Frameworks

* **Next.js 14**
  Full-stack React framework providing server-side rendering, file-based routing, and optimized edge deployments.

* **React**
  UI library for building reusable, interactive components.

* **TypeScript**
  Typed superset of JavaScript for type safety and improved tooling.

* **Tailwind CSS**
  Utility-first CSS framework enabling rapid, consistent styling.

* **Clerk**
  Authentication and user management, integrated via `@clerk/nextjs`.

* **Prisma ORM**
  Type-safe database client to interact with the **PostgreSQL** database.

* **PostgreSQL (Neon)**
  Relational database managed via Neon, a serverless PostgreSQL provider for scalable deployments.

* **OpenAI API & OpenAI Edge**
  Provides AI features with low-latency edge deployments.

* **Stripe**
  Handles subscription billing, payments, and webhooks.

* **Axios**
  Promise-based HTTP client for server and third-party API communication.

* **Orama**
  Vector database used for semantic search and AI-enhanced data queries.

* **@tanstack/react-query**
  Manages client-side data fetching and caching.

* **clsx & tailwind-merge**
  Utilities for conditionally combining and merging Tailwind CSS classes efficiently.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/zdemirgithub/mailplain.git
```

### 2. Navigate to the project directory

```bash
cd mailplain
```

### 3. Install Node.js

Ensure **Node.js v13.4.19** or later is installed.
Download from [https://nodejs.org/en/download/](https://nodejs.org/en/download/)

### 4. Install dependencies

```bash
npm install
```

This installs all dependencies declared in `package.json`, including:

* Core framework: Next.js, React, React DOM
* Styling: Tailwind CSS
* API clients: Axios, Stripe, OpenAI, Orama
* Auth: @clerk/nextjs
* Database: Prisma, Neon PostgreSQL
* Utility libraries: clsx, tailwind-merge

### 5. Setup environment variables

Create a `.env` file in the project root. Add required environment variables for:

* Clerk (authentication)
* Stripe (payments & webhooks)
* OpenAI (AI services)
* PostgreSQL (Neon connection string)
* Orama (vector database API key)

Example `.env` entries:

```
NEXT_PUBLIC_CLERK_FRONTEND_API=...
CLERK_API_KEY=...
STRIPE_SECRET_KEY=...
OPENAI_API_KEY=...
DATABASE_URL=...
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the app.

---

This guide provides the essential setup and environment for local development, including the main dependencies and configuration needed to start the project.

---



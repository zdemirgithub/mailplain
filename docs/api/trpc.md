# 📘 tRPC API Reference

This document outlines the server-side procedures defined via `tRPC` in the application.

## 🧩 Routers

### `mailRouter`

* `getThreads(accountId: string)` → `EmailThread[]`
* `getThread(threadId: string)` → `EmailThread`

### `searchRouter`

* `query(q: string)` → `SearchResult[]`

### `webhooksRouter`

* `getWebhooks(accountId: string)` → `Webhook[]`
* `createWebhook(accountId: string, notificationUrl: string)` → `Webhook`
* `deleteWebhook(accountId: string, webhookId: string)` → `void`

## 🔐 Protected Procedures

All procedures are wrapped in `protectedProcedure` and require Clerk-authenticated sessions.

## 🧪 Testing

Each router is covered by:

* **Integration tests**: `src/__tests__/integration/routers.test.ts`
* **E2E tests**: Cypress tests simulate interactions

## 🔗 Usage (Client)

```ts
const { data, isLoading } = trpc.mail.getThreads.useQuery({ accountId });
```

For caller factory usage on the server:

```ts
const caller = createCaller(authCtx);
await caller.mail.getThread("abc123");
```

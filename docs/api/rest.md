# 🌐 REST API Reference

The project exposes limited RESTful endpoints in addition to tRPC.

## Endpoints

### `POST /api/webhooks/stripe`

Handles Stripe webhook events (subscription creation, update, deletion).

* Auth: None
* Body: Raw JSON from Stripe
* Response: 200 OK or 400 on error

### `POST /api/aurinko/webhook`

Webhook handler for incoming email events from Aurinko

* Auth: None
* Body: Depends on Aurinko format
* Response: 200 OK

### `GET /api/initial-sync`

Triggers a background sync for authenticated user accounts

* Auth: Clerk JWT required
* Response: 202 Accepted or 401 Unauthorized

### `GET /api/aurinko/callback`

OAuth callback endpoint from Aurinko authorization

* Auth: Clerk session inferred
* Query: `code=xyz`
* Response: Redirect

## Security

* Sensitive endpoints use Clerk JWT (middleware-enforced)
* Webhook endpoints validate signatures where applicable (e.g., Stripe)

## Testing

* Unit and integration test coverage under `src/__tests__`
* Stripe and Aurinko endpoints validated with mock payloads

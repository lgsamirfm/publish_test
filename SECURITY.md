# Production security runbook

## Release blockers

Run these before every deployment:

```bash
npm ci
npm audit --omit=dev
npm run lint
npm run typecheck
npm run build
npm run security:check
```

`npm start` also runs the production configuration check and fails closed if required controls are missing.

## Required configuration

Copy the variable names from `.env.example` into the deployment secret manager. Never commit real values.

- `APP_URL`: exact HTTPS public origin. This is used to validate mutation origins (CSRF defense).
- `AUTH_SECRET`: random 32+ character secret; 48 random bytes is recommended.
- `DATABASE_URL`: an absolute `file:/...` path on a persistent, backed-up volume, or a remote libSQL URL with `DATABASE_AUTH_TOKEN`.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: required for distributed rate limiting.
- `SMS_WEBHOOK_URL` and `SMS_WEBHOOK_TOKEN`: required for password reset. The webhook accepts `POST {to, message}` and must return 2xx.

`RATE_LIMIT_ALLOW_MEMORY=true` is an explicit exception for exactly one persistent Node process. Never use it with serverless functions, autoscaling, multiple replicas, or rolling deployments.

## Payment blocker

The repository does **not** contain a real payment-service-provider integration. The old fake gateway allows a browser to choose a successful result and therefore cannot establish payment. It is now unreachable in production and requires two development-only conditions (`NODE_ENV !== production` and `ENABLE_SIMULATED_PAYMENTS=true`).

Production supports cash on delivery for physical products. Digital-pattern and online checkout are visibly disabled until a real PSP integration with a server-to-server signed callback is implemented. Do not remove this fail-closed guard to meet a deadline.

## Before first launch

1. Add the required values to the deployment secret manager.
2. Run `npm run db:deploy` against the production database and create an encrypted backup.
3. Bootstrap the first admin with temporary `SEED_ADMIN_PHONE` and a unique 12+ character `SEED_ADMIN_PASSWORD`, run `npm run db:seed`, then remove those variables.
4. **If the old seed was ever run**, immediately rotate or delete the known `09120000000` and `09121234567` accounts. The production check rejects either account while it still has its publicly known password.
5. Run the release-blocker commands above; `security:check` must have access to the initialized production database.
6. Configure TLS at the edge, redirect HTTP to HTTPS, and keep the application port private behind the trusted reverse proxy.
7. Test the SMS webhook, login throttling, CSRF rejection, admin authorization, order ownership, and backup restore in staging.
8. Put Redis and SMS provider alerts in place. Sensitive writes fail closed when distributed throttling is unavailable.

## Controls implemented

- Server-side authorization on all admin, order, purchase-content, and payment routes.
- Signed, `HttpOnly`, `Secure`, `SameSite=Lax` sessions with expiry and password-change revocation.
- Origin and Fetch Metadata checks on all mutating APIs.
- Distributed throttling on authentication, password reset, ordering, payment, content, and admin mutations; broad per-process flood limits as defense in depth.
- Streaming JSON body limits, input length/type/range checks, and server-side order pricing.
- Hashed reset codes at rest, cryptographic OTP generation, single-use atomic consumption, and no production OTP disclosure.
- CSP, HSTS, clickjacking, MIME sniffing, referrer, permissions, cross-origin, cache, and indexing headers.
- Pattern HTML path confinement, real-path/symlink checks, size limits, restrictive CSP, and an opaque-origin sandbox.
- Dependency lockfile with zero known npm audit findings at the time of this review.

No review can prove that software has “no security risk.” Re-audit after infrastructure, payment, upload, authentication, or dependency changes, and use external penetration testing for a high-value launch.

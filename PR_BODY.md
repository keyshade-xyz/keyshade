Integrations: handle ENVIRONMENT_UPDATED and ENVIRONMENT_DELETED for Vercel & AWS Lambda (fixes #1254)

Summary
-------
This branch implements handlers for environment lifecycle events for the Vercel and AWS Lambda integrations.

Key changes
- Vercel integration: added handling for `ENVIRONMENT_DELETED` and `ENVIRONMENT_UPDATED`.
  - On delete: remove project-level env vars scoped to the deleted environment and disconnect the integration->environment relation.
  - On update: best-effort rename of custom Vercel environments and persist an audit Event in Keyshade.
- AWS Lambda integration: added handling for `ENVIRONMENT_DELETED` and `ENVIRONMENT_UPDATED`.
  - On delete: remove environment-scoped keys from the Lambda function configuration and disconnect the environment relation.
  - On update: no external action (Lambda has no environment rename semantics); handler is a no-op and logs an audit Event.
- Add `retryWithBackoff` helper and use it around provider API calls for transient error resilience.
- On repeated failures, persist `pendingCleanup` entries inside `integration.metadata` (encrypted). A lightweight reconciler is included to process these entries.
- Unit tests: added tests covering ENVIRONMENT_DELETED and ENVIRONMENT_UPDATED flows (Vercel + Lambda), failure/reconciler behavior, and the reconciler itself.

Notes & follow-ups
- A few `any` casts were used to unblock progress (notably for `integration.id` access in some places). A follow-up typed-refactor is recommended.
- Reconciler is implemented as a plain function in `apps/api/src/integration/reconciler.ts`. For production use it should be scheduled (cron), be more resilient, and provide metrics/alerts.
- Metrics increments were not wired into the integrations because `MetricService` is DI-managed. I can follow up to wire metrics into the IntegrationFactory if desired.

How to verify locally
1. Generate Prisma client and build the API:
   ```bash
   cd apps/api
   pnpm db:generate-types
   pnpm build
   ```
2. Run unit tests:
   ```bash
   cd apps/api
   pnpm run unit
   ```

Files of interest
- `apps/api/src/integration/plugins/vercel.integration.ts`
- `apps/api/src/integration/plugins/aws-lambda.integration.ts`
- `apps/api/src/common/util.ts` (added `retryWithBackoff`)
- `apps/api/src/integration/reconciler.ts` (new)
- `apps/api/src/integration/plugins/*.spec.ts` (new/updated tests)

Follow-up work recommended (can include these in the PR description or track separately):
- Wire MetricService into IntegrationFactory and instrument ENVIRONMENT_UPDATED/DELETED counters.
- Convert `any` casts to proper types.
- Implement a scheduled reconciler with backoff/alerting and tests.

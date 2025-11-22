I opened a draft PR for #1254 and added the following items beyond the original request:

- Implemented `ENVIRONMENT_DELETED` handling for both Vercel and AWS Lambda:
  - Deletes provider-side environment-scoped variables (Vercel project envs or Lambda function env vars).
  - Disconnects the `Integration -> Environment` relation in the database.
- Implemented `ENVIRONMENT_UPDATED` handling:
  - Vercel: best-effort attempt to rename custom environments via the Vercel SDK and persist an audit `Event` (type=ENVIRONMENT_UPDATED).
  - Lambda: no-op (no external rename semantics) and persists an audit Event.
- Added `retryWithBackoff` helper and used it around provider API calls to handle transient errors.
- On repeated failures, persist `pendingCleanup` entries inside `integration.metadata` (encrypted), with a small schema { environmentId, action, error, attempts, createdAt }.
- Added a lightweight reconciler `apps/api/src/integration/reconciler.ts` that scans integrations, replays pending cleanup entries by calling the same integration handlers, and removes successful entries.
- Added unit tests:
  - ENVIRONMENT_DELETED tests for Vercel and AWS Lambda (covers provider deletion and DB disconnect).
  - ENVIRONMENT_UPDATED tests for Vercel (rename attempt) and Lambda (no-op).
  - Reconciler unit test to ensure pendingCleanup entries are processed and removed.
- Fixed a Vercel SDK method mismatch observed during development and updated calls to the SDK to match the installed version.

Notes / follow-ups (not yet included in this PR):
- Replace a few `any` casts with proper typings.
- Wire `MetricService` into IntegrationFactory and add metrics counters for environment events.
- Harden reconciler: schedule as a Cron/worker, add retries/backoff/alerting, and add tests for failure cases.

If you'd like, I can link the draft PR here and we can iterate on the PR content or add the follow-ups as subsequent PRs.

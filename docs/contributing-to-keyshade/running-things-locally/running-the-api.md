---
description: Get to know how you can develop the API!
---

# Running the API

The API resides in the `apps/api` directory. It is a NestJS project. To run the API locally, do the following:

* Generate the prisma types:

```bash
pnpm run db:generate-types
```

* Deploy the migrations:

```bash
pnpm run db:deploy-migrations
```

* Start the server in development mode:

```bash
pnpm run dev:api
```

## Testing your code

We currently perform two kinds of tests: **unit tests** and **integration tests.**&#x20;

After you make sure that you have added your unit tests, or you have made some changes to the existing functionality, you can run them using:

```bash
pnpm run test:api
```

After this is complete, you can run the integration tests. But for that, you would first need your test DB to be up and running. These commands will do of that for you.

```bash
docker compose up -d
pnpm run e2e:api
docker compose down
```

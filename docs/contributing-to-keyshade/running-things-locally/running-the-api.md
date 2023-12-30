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

* Once you have made the changes and added tests (if any), make sure to test the code:

```bash
pnpm run test:api
```

* Lint the code:

```bash
pnpm run lint:api
```

* Run prettier:

```bash
pnpm run prettier:fix:api
```

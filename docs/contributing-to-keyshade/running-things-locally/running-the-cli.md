---
description: Get to know how you can develop the CLI!
---

# Running the CLI

You can get started with developing the CLI using the following steps:

- Start developing the code

- The CLI depends upon 2 internal packages: `@keyshade/api-client` and `@keyshade/secret-scan`. Build these two packages:

  ```bash
  pnpm build:api-client
  pnpm build:secret-scan
  ```

- Run the API:

  ```bash
  docker compose up -d
  pnpm dev:api
  ```

- To make a quick check of the features you have just built, run:

  ```bash
  pnpm dev:cli -- <whatever command goes here>
  ```

Note that, if you make any changes to any of the two packages mentioned above, you would need to rebuild them. Otherwise, the changes would not be reflected in the CLI.

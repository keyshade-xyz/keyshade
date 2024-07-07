---
description: Get to know how you can develop the CLI!
---

# Running the CLI

You can get started with developing the CLI using the following steps:

- Start developing the code
- Run the API:
  ```bash
  docker compose up -d
  pnpm dev:api
  ```
- Run the build command to continuously build the code:
  ```bash
  cd apps/cli && pnpm build:cli
  ```
- Run the CLI:
  ```bash
  cd apps/cli && node dist/index.js <command> [subcommand] <arguments> [options]
  ```

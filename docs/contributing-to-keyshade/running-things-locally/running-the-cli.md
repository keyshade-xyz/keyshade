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

- To make a quick check of the features you have just built, run:

  ```bash
  pnpm dev:cli -- <whatever command goes here>
  ```
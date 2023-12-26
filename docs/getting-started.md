# Getting Started

This document is meant to help you get started with running the project and developing it locally. Before getting started, make sure you have forked the repository and cloned it locally.

## Environment Variables

Here's the description of the environment variables used in the project. You can find the values for these variables in [`.env.example`](../.env.example).

- **DATABASE_URL**: The URL of the PSQL database to connect to. This is used by the [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client) to connect to the database.

- **SUPABASE_API_URL**: The URL of the Supabase API. This is used by the [Supabase Client](https://supabase.io/docs/reference/javascript/supabase-client) to connect to the Supabase API. Make sure you create a Supabase project and get the API URL from the project settings.

- **SUPABASE_ANON_KEY**: The anonymous key of the Supabase project. This is used by the [Supabase Client](https://supabase.io/docs/reference/javascript/supabase-client) to connect to the Supabase API. Make sure you create a Supabase project and get the anonymous key from the project settings.

- **RESEND_API_KEY**: The API key for the [Resend API](https://resend-api.vercel.app/). The project uses Resend API to send out emails.

- **JWT_SECRET**: The secret used to sign the JWT tokens. It is insignificant in the development environment.

- **FROM_EMAIL**: The email address from which the emails will be sent. This is used by the [Resend API](https://resend-api.vercel.app/) to send out emails.

- **WEB_FRONTEND_URL, WORKSPACE_FRONTEND_URL**: The URLs of the web and workspace frontend respectively. These are used in the emails sometimes and in other spaces of the application too.

## Setting up the .env file

- Make a copy of the `.env.example` file and rename it to `.env`
  ```bash
  cp .env.example .env
  ```
- Fill in the values for the environment variables in the `.env` file. You can find the values for the variables in the [Environment Variables](#environment-variables) section.

## Setting up `pnpm`

The project uses `pnpm` as the package manager. To install `pnpm`, run the following command:

```bash
npm install -g pnpm
```

## Installing the dependencies

To install the dependencies, run the following command:

```bash
pnpm install
```

## Running the API

The API resides in the `apps/api` directory. It is a NestJS project. To run the API locally, do the following:

- Generate the prisma types:

  ```bash
  pnpm run db:generate-types
  ```

- Generate the migrations:

  ```bash
  pnpm run db:generate-migrations
  ```

- Deploy the migrations:

  ```bash
  pnpm run db:deploy-migrations
  ```

- Start the server in development mode:

  ```bash
  pnpm run dev:api
  ```

- Once you have made the changes and added tests (if any), make sure to test the code:

  ```bash
  pnpm run test:api
  ```

- Lint the code:

  ```bash
  pnpm run lint:api
  ```

- Run prettier:
  ```bash
  pnpm run prettier:fix:api
  ```

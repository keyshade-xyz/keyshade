---
description: A tour of how to get the prerequisites done
---

# Setting things up

## Setting up the .env file

Make a copy of the `.env.example` file and rename it to `.env`

```bash
cp .env.example .env
```

Fill in the values for the environment variables in the `.env` file. You can find the values for the variables in the [Environment Variables](environment-variables.md) section.&#x20;

## Installing Docker

We tend to use docker for doing the heavy lifting on our behalf. Currently, we use it to set up the integration test environment before you make a commit. To make sure your experience is smooth, consider installing docker from [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)

## Setting up `pnpm`

keyshade works with any version of **node (>=18)** and takes the liberty that you have it installed. The project uses `pnpm` as the package manager. To install `pnpm`, run the following command:

```bash
npm install -g pnpm
```

{% hint style="info" %}
For Linux users, in case the above command fails with permission error, try running this:

```bash
sudo npm install -g pnpm
```

{% endhint %}

## Installing the dependencies

To install the dependencies, run the following command:

```bash
pnpm install
```

## Installing Turbo

The final step involves installing our monorepo management tool. We have transitioned to using Turbo to streamline our development process. To install Turbo, run the following command:

```bash
npm install turbo --global
```

For more information on how to get started with Turbo, refer to the [official Turbo documentation](https://turbo.build/repo/docs).

## Installing nest CLI

If you plan to work on the API, you would need the **NestJS CLI.** To do this, simply run:

```bash
npm install -g @nestjs/cli
```

## Settng up the development environment

We cluster every dependency that keyshade will need into our `docker compose` file. So, in order to start developing, you will first need to fire up these dependencies using one single command:

```bash
docker compose up -d
```

This will start the following things in a dockerized environment and then expose the services yo your host maching:

1. PostgreSQL: This is the database that keyshade uses to store all the data.
2. Redis: This is the cache store that keyshade uses to store the cache data.
3. Minio: This is the object storage that keyshade uses to store the files.

Please note that, in order for these steps to work, you will need to ensure that the following ports are free:

- 5432
- 6379
- 9000
- 9001

### Issues regarding PostgreSQL

We have heard quite a few contributors facing a difficult time in getting PSQL to work. If you are facing issues with PostgreSQL, you can try the following:

- Ensure that you don't have a local version of PostgreSQL running on your machine.
- Make sure that you don't have any other docker containers running on the same port.

### Shutting things down

Once you have finished your development, it is recommended to shut down the docker infrastructure using:

```bash
docker compose down
```

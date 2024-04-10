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

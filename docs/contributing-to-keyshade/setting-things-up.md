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

## Installing NX

The last step is to install NX. It is the monorepo management tool that we are using. Read more about it in [https://nx.dev](https://nx.dev). To install nx, you need to run the following command:

```bash
npm i -g nx
```

## Installing nest CLI

If you plan to work on the API, you would need the **NestJS CLI.** To do this, simply run:

```bash
npm install -g @nestjs/cli
```

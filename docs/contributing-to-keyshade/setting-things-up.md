# Setting things up

## Setting up the .env file

Make a copy of the `.env.example` file and rename it to `.env`

```bash
cp .env.example .env
```

Fill in the values for the environment variables in the `.env` file. You can find the values for the variables in the [Environment Variables](environment-variables.md) section.&#x20;

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
pnpm i -g nx
```


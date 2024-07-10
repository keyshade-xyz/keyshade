---
description: The magic behind the CLI tool.
---

# How the CLI works

When developing the CLI, we ensured that we would prioritize ease of use and simplicity. We had the following goals in mind:

- **Secure by design**: We wanted to ensure that your secrets (API Keys and project private keys) are safe by default.
- **Easy to interpret and configure**: The configuration files that we use to make the CLI run are readable, lightweight and easy to understand.
- **Fast and efficient**: We wanted to ensure that the CLI is fast and efficient, so that you can get your work done quickly.

## The three main configuration files

When using our CLI, you would need to configure it first.

### Profile

This includes creating one or more [`profiles`](../cli/profile.md). A profile is a simple object that stores your API Key and the API base URL (Yes! We do give you the option to configure the base URL of the API).

The following is the TypeScript interface for a profile:

```typescript
interface ProfileConfig {
  default: string
  [name: string]: {
    apiKey: string
    baseUrl: string
  }
}
```

All of your profiles are stored under `~/.keyshade/profiles.json`. You have the ability to have multiple profiles at once. The `default` key is used to specify the default profile that should be used when no profile is specified.

With this done, you can easily use any command to modify items on the platform.

### Project configuration

If you would like your application to tap into the live updates from our platform, you would need to [`init`](../cli/init.md) your project. This command creates a `keyshade.json` file in your project root. This file contains the following information:

```typescript
interface ProjectRootConfig {
  workspace: string
  project: string
  environment: string
}
```

Note that, you can only tap into updates for any given trio of `project`, `environment` and `workspace`.

### Private Key

Perhaps the most important sensitive data in the entire application, we store the secret in a file named `private-keys.json` file under the `~/.keyshade` directory. This file contains key-value pairs of the project+environment name and the private key.

```typescript
interface PrivateKeyConfig {
  [projectEnvironment: string]: string
}
```

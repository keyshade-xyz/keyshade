---
description: Get your CLI tied up with Keyshade API
---

# Setting up your profile

To use the CLI, you would first need to set up a profile. A profile contains details about you, and the API the CLI would be tapping into.

## Logging In

Keyshade allows you to perform a secure login directly from your CLI. Once authenticated successfully, you would have your profile configured locally. To begin, run this command:
```shell
keyshade login
```

This will ask you for your email—the one that you used earlier to sign up to keyshade, and a deployment URL. In case you are using a self-hosted deployment, you would need to provide the base URL of your API (example - `https://keyshade-api.mydomain.com`).
Otherwise, you can skip this step.

Next, enter the sign-in code that you received in your email. 

And that's it! You are all set to use the CLI.

## Test your profile

You can run this command to check if your profile is set up correctly:

```shell
keyshade workspace list
```

This command should output a list of all the workspaces that you have access to. If you have just started, there should be only one workspace.

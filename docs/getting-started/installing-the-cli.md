---
description: A walkthrough of how to install the Keyshade CLI
---

# Setting up the CLI

The Keyshade CLI serves as the entrypoint for your projects and apps to use Keyshade. Currently, our CLI binary is hosted over the npm registry, and it can be installed by running the following command:

## Installation

```sh
npm i -g @keyshade/cli
```

That's it! You now have Keyshade installed on your system.

To verify the installation, you can run the following command:

```sh
keyshade --version
```

This should print the version of the Keyshade CLI installed on your system.

![keyshade-cli](../../blob/keyshade-version.png) 

_(Version shown here is `3.0.1`, but yours may differ depending on installation time or updates.)_

## Authenticate the CLI

Keyshade allows you to perform a secure login directly from your CLI. Once authenticated successfully, you would have your profile configured locally. To begin, run this command:
```shell
keyshade login
```

{% embed url="https://files.gitbook.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FklyYIOuyG5AKyh2FIsOK%2Fuploads%2Fl3JCFYHob9Ojrr6D1rtI%2Flogin.mp4?alt=media&token=78d2fba9-2bc5-4259-973d-0328466fa9d9" %}


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

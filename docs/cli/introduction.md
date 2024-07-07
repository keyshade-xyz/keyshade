---
description: Get up and running with our CLI tool in no time.
---

# Introduction

Our CLI is one of the major component of keyshade. The CLI is the entrypoint for your application to tap into the live updates from our platform. Whatever changes you make to your secrets or variables in your project, are reflected automatically in your application. Besides that, it also helps you to interact with the keyshade API.

## Commands

The CLI has the following commands:

- [`profile`](./profile.md): This command is used to create, delete, list and switch between profiles.
- [`init`](./init.md): This command is used to initialize your project to tap into the live updates from our platform.
- [`run`](./run.md): This command is used to run your application.

## Global flags

Global flags work with any command in the CLI. The following are the global flags:

### `--profile <profile>`

This flag is used to specify the profile to use. If not specified, the default profile is used. If you specify this flag, the [`--api-key`](#--api-key-key) flag and the [`--base-url`](#--base-url-url) flag are ignored.

### `--api-key <key>`

This flag is used to specify the API key to use. Won't work if the [`--profile`](#--profile-profile) flag is specified.

### `--base-url <url>`

This flag is used to specify the base URL of the API to use. Won't work if the [`--profile`](#--profile-profile) flag is specified. The default is `https://api.keyshade.xyz`.

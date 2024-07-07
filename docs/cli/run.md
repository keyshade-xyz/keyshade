---
description: The `run` command
---

# `run`

The `run` command is used to run your application. All the secrets and variables are injected into your application as environment variables. This command reads the `keyshade.json` file in your project root to get the necessary information.

## Usage

```bash
keyshade run <command> [options]
```

## Arguments

These are the arguments supported by the `run` command:

### `<command>`

The command to run your application. This command is run in the same shell as the `keyshade run` command.

## Options

The function accepts no local options. However, the global flags can be used with this command.

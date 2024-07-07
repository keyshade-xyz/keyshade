---
description: The `init` command
---

# `init`

The `init` command is used to initialize your project to tap into the live updates from our platform. This command creates a `keyshade.json` file in your project root. This file contains the following information:

## Usage

```bash
keyshade init [options]
```

## Options

These are the commands supported by the `init` command:

### `-w, --workspace <workspace>`

The workspace name whose updates you want to tap into.

### `-p, --project <project>`

The project name whose updates you want to tap into. Note that this project must be under the specified workspace.

### `-e, --environment <environment>`

The environment name whose updates you want to tap into. Note that this environment must be under the specified project.

### `-k, --private-key <key>`

The private key for the project+environment pair. This key is used to decrypt the secrets that are sent to your application.

### `-o, --overwrite`

This flag is used to overwrite the existing `keyshade.json` file in the project root. The default is `false`.

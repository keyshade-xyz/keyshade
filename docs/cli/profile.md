---
description: The `profile` command
---

# `profile`

The `profile` command is used to manage all the profiles in the CLI. A profile is a collection of configurations that are used to interact with the keyshade API. It has a set of subcommands:

- [`create`](#create): This command is used to create a new profile.
- [`update`](#update): This command is used to update the properties of an existing profile.
- [`delete`](#delete): This command is used to delete an existing profile.
- [`list`](#list): This command is used to list all the profiles.
- [`use`](#use): This command is used to set a default profile.

## Usage

```bash
keyshade profile <subcommand> [options]
```

## `create`

### Usage

```bash
keyshade profile create [options]
```

### Options

These are the commands supported by the `create` command:

#### `-n, --name <name>`

The name of the profile. This is a required field.

#### `-a, --api-key <key>`

The API key to use with this profile. This is a required field.

#### `-b, --base-url <url>`

The base URL of the API to use with this profile. The default is `https://api.keyshade.xyz`.

#### `--set-default`

If set, this profile will be set as the default profile. Default is `false`.

## `update`

### Usage

```bash
keyshade profile update <profile> [options]
```

### Arguments

These are the arguments supported by the `update` command:

#### `<profile>`

The name of the profile to update.

### Options

These are the commands supported by the `update` command:

#### `-n, --name <name>`

The new name of the profile.

#### `-a, --api-key <key>`

The new API key to use with this profile.

#### `-b, --base-url <url>`

The new base URL of the API to use with this profile.

## `delete`

### Usage

```bash
keyshade profile delete <profile> [options]
```

### Arguments

These are the arguments supported by the `delete` command:

#### `<profile>`

The name of the profile to delete.

## `list`

### Usage

```bash
keyshade profile list [options]
```

### Options

These are the commands supported by the `list` command:

#### `-v, --verbose`

If set, the output will list out the API keys and base URLs as well. Default is `false`.

## `use`

### Usage

```bash
keyshade profile use <profile> [options]
```

### Arguments

These are the arguments supported by the `use` command:

#### `<profile>`

The name of the profile to set as the default profile.

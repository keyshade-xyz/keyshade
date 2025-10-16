---
description: The `secret` command
---

# `secret`

The `secret` command is used to manage secrets in Keyshade. A secret is a sensitive credential or authentication data that needs to be protected and managed securely. It has a set of subcommands:

- [`create`](#create): This command is used to create a new secret.
- [`delete`](#delete): This command is used to delete an existing secret.
- [`disable`](#disable): This command is used to disable a secret in a specific environment.
- [`enable`](#enable): This command is used to enable a disabled secret in a specific environment.
- [`list`](#list): This command is used to list all secrets in a project.
- [`revisions`](#revisions): This command is used to fetch all revisions of a secret.
- [`rollback`](#rollback): This command is used to rollback a secret to a previous version.
- [`update`](#update): This command is used to update the properties of an existing secret.

## Usage

```bash
keyshade secret <subcommand> [options]
```

## `create`

### Usage

```bash
keyshade secret create <project-slug> [options]
```

### Arguments

These are the arguments supported by the create command:

#### `<project-slug>`

The slug of the project under which you want to create the secret.

### Options

These are the options supported by the `create` command:

#### `-n, --name <string>`

The name of the secret. Must be unique across the project.

#### `-d, --note <string>`

A note describing the usage of the secret.

#### `-r, --rotate-after <string>`

The duration in days after which the value of the secret should be rotated. Accepted values are `24`, `168`, `720`, `8760` and `never`. Defaults to `never`.

#### `-e, --entry [entries...]`

An array of values for the secret. If specified, should be in the form `<environment slug>=<value>`.

### Examples

```bash
# Create a secret
keyshade secret create project-1 --name "API_KEY" --entry "alpha=ks_k23mg45kl6k76l"

# Create a secret with note and rotate settings
keyshade secret create project-1 --name "API_KEY" --note "This is a secret" --rotate-after "24"
```

## `delete`

### Usage

```bash
keyshade secret delete <secret-slug>
```

### Arguments

These are the arguments supported by the delete command:

#### `<secret-slug>`

The slug of the secret that you want to delete.

### Examples

```bash
# Delete a secret
keyshade secret delete secret-1
```

## `disable`

### Usage

```bash
keyshade secret disable <secret-slug> [options]
```

### Arguments

These are the arguments supported by the disable command:

#### `<secret-slug>`

The slug of the secret that you want to disable.

### Options

These are the options supported by the `disable` command:

#### `-e, --environment <string>`

Environment slug of the environment where the secret should be disabled.

### Examples

```bash
# Disable secret for a given environment
keyshade secret disable secret-1 --environment local-3
```

## `enable`

### Usage

```bash
keyshade secret enable <secret-slug> [options]
```

### Arguments

These are the arguments supported by the enable command:

#### `<secret-slug>`

The slug of the secret that you want to enable.

### Options

These are the options supported by the `enable` command:

#### `-e, --environment <string>`

Environment slug of the environment where the secret should be enabled.

### Examples

```bash
# Enable secret for a given environment
keyshade secret enable secret-1 --environment local-3
```

## `list`

### Usage

```bash
keyshade secret list <project-slug> [options]
```

### Arguments

These are the arguments supported by the list command:

#### `<project-slug>`

The slug of the project whose secrets you want to list.

### Options

These are the options supported by the `list` command:

#### `-v, --verbose`

Prints detailed information about each secret.

#### `PAGINATION_OPTION`

The `list` command supports pagination options. These options are defined in the `PAGINATION_OPTION` constant:

- `-p, --page <int>`: Index of the page.
- `-l, --limit <int>`: Total number of items per page.
- `-o, --order <string>`: Order to sort by - either ascending (ASC) or descending (DESC).
- `--sort <string>`: Field to sort by.
- `-s, --search <string>`: Search term.

### Examples

```bash
# List all secrets under a project
keyshade secret list project-1

# List with pagination options
keyshade secret list project-1 --page 1 --limit 10

# List with verbose output
keyshade secret list project-1 --verbose
```

## `revisions`

### Usage

```bash
keyshade secret revisions <secret-slug> [options]
```

### Arguments

These are the arguments supported by the revisions command:

#### `<secret-slug>`

The slug of the secret whose revisions you want to fetch.

### Options

These are the options supported by the `revisions` command:

#### `-e, --environment <string>`

Environment slug of the secret whose revisions you want to fetch.

#### `-d, --project-slug <string>`

Optionally decrypt the value by providing the project slug of the secret.

#### `PAGINATION_OPTION`

The `revisions` command supports pagination options. These options are defined in the `PAGINATION_OPTION` constant:

- `-p, --page <int>`: Index of the page.
- `-l, --limit <int>`: Total number of items per page.
- `-o, --order <string>`: Order to sort by - either ascending (ASC) or descending (DESC).
- `--sort <string>`: Field to sort by.
- `-s, --search <string>`: Search term.

### Examples

```bash
# Fetch all revisions of a secret
keyshade secret revisions secret-1 --environment dev

# Fetch with pagination options
keyshade secret revisions secret-1 --environment dev --page 1 --limit 10

# Fetch with decryption
keyshade secret revisions secret-1 --environment dev --project-slug project-1
```

## `rollback`

### Usage

```bash
keyshade secret rollback <secret-slug> [options]
```

### Arguments

These are the arguments supported by the rollback command:

#### `<secret-slug>`

The slug of the secret that you want to rollback.

### Options

These are the options supported by the `rollback` command:

#### `-v, --version <string>`

Version of the secret to which you want to rollback.

#### `-e, --environment <string>`

Slug of the environment of the secret to which you want to rollback.

### Examples

```bash
# Rollback a secret
keyshade secret rollback secret-1 --version 2 --environment dev
```

## `update`

### Usage

```bash
keyshade secret update <secret-slug> [options]
```

### Arguments

These are the arguments supported by the update command:

#### `<secret-slug>`

The slug of the secret that you want to update.

### Options

These are the options supported by the `update` command:

#### `-n, --name <string>`

The new name of the secret.

#### `-d, --note <string>`

An optional note describing the usage of the secret.

#### `-r, --rotate-after <string>`

The duration in days after which the value of the secret should be rotated. Accepted values are `24`, `168`, `720`, `8760` and `never`. Defaults to `never`.

#### `-e, --entry [entries...]`

An array of values for the secret. If specified, should be in the form `<environment slug>=<value>`.

### Examples

```bash
# Update secret's name and note
keyshade secret update secret-1 --name "MY_NEW_SECRET" --note "This is a secret"

# Update the rotation time of a secret
keyshade secret update secret-1 --rotate-after "24"

# Add more entries to a secret
keyshade secret update apikey-1 --entry "dev=super" "prod=secret"
```

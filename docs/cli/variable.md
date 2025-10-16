---
description: The `variable` command
---

# `variable`

The `variable` command is used to manage variables in Keyshade. A variable is a non-sensitive configuration value that your applications need to function properly. It has a set of subcommands:

- [`create`](#create): This command is used to create a new variable.
- [`delete`](#delete): This command is used to delete an existing variable.
- [`disable`](#disable): This command is used to disable a variable in a specific environment.
- [`enable`](#enable): This command is used to enable a disabled variable in a specific environment.
- [`list`](#list): This command is used to list all variables in a project.
- [`revisions`](#revisions): This command is used to fetch all revisions of a variable.
- [`rollback`](#rollback): This command is used to rollback a variable to a previous version.
- [`update`](#update): This command is used to update the properties of an existing variable.

## Usage

```bash
keyshade variable <subcommand> [options]
```

## `create`

### Usage

```bash
keyshade variable create <project-slug> [options]
```

### Arguments

These are the arguments supported by the create command:

#### `<project-slug>`

The slug of the project under which you want to create the variable.

### Options

These are the options supported by the `create` command:

#### `-n, --name <string>`

The name of the variable. Must be unique across the project.

#### `-d, --note <string>`

A note describing the usage of the variable.

#### `-e, --entry [entries...]`

An array of values for the variable. If specified, should be in the form `<environment slug>=<value>`.

### Examples

```bash
# Create a variable
keyshade variable create project-1 --name "PORT" --entry "alpha=8080"

# Create a variable with note
keyshade variable create project-1 --name "PORT" --note "This is a variable"
```

## `delete`

### Usage

```bash
keyshade variable delete <variable-slug>
```

### Arguments

These are the arguments supported by the delete command:

#### `<variable-slug>`

The slug of the variable that you want to delete.

### Examples

```bash
# Delete a variable
keyshade variable delete variable-1
```

## `disable`

### Usage

```bash
keyshade variable disable <variable-slug> [options]
```

### Arguments

These are the arguments supported by the disable command:

#### `<variable-slug>`

The slug of the variable that you want to disable.

### Options

These are the options supported by the `disable` command:

#### `-e, --environment <string>`

Environment slug of the environment where the variable should be disabled.

### Examples

```bash
# Disable variable for a given environment
keyshade variable disable variable-1 --environment local-3
```

## `enable`

### Usage

```bash
keyshade variable enable <variable-slug> [options]
```

### Arguments

These are the arguments supported by the enable command:

#### `<variable-slug>`

The slug of the variable that you want to enable.

### Options

These are the options supported by the `enable` command:

#### `-e, --environment <string>`

Environment slug of the environment where the variable should be enabled.

### Examples

```bash
# Enable variable for a given environment
keyshade variable enable variable-1 --environment local-3
```

## `list`

### Usage

```bash
keyshade variable list <project-slug> [options]
```

### Arguments

These are the arguments supported by the list command:

#### `<project-slug>`

The slug of the project whose variables you want to list.

### Options

These are the options supported by the `list` command:

#### `-v, --verbose`

Prints detailed information about each variable.

#### `PAGINATION_OPTION`

The `list` command supports pagination options. These options are defined in the `PAGINATION_OPTION` constant:

- `-p, --page <int>`: Index of the page.
- `-l, --limit <int>`: Total number of items per page.
- `-o, --order <string>`: Order to sort by - either ascending (ASC) or descending (DESC).
- `--sort <string>`: Field to sort by.
- `-s, --search <string>`: Search term.

### Examples

```bash
# List all variables under a project
keyshade variable list project-1

# List with pagination options
keyshade variable list project-1 --page 1 --limit 10

# List with verbose output
keyshade variable list project-1 --verbose
```

## `revisions`

### Usage

```bash
keyshade variable revisions <variable-slug> [options]
```

### Arguments

These are the arguments supported by the revisions command:

#### `<variable-slug>`

The slug of the variable whose revisions you want to fetch.

### Options

These are the options supported by the `revisions` command:

#### `-e, --environment <string>`

Environment slug of the variable whose revisions you want to fetch.

#### `PAGINATION_OPTION`

The `revisions` command supports pagination options. These options are defined in the `PAGINATION_OPTION` constant:

- `-p, --page <int>`: Index of the page.
- `-l, --limit <int>`: Total number of items per page.
- `-o, --order <string>`: Order to sort by - either ascending (ASC) or descending (DESC).
- `--sort <string>`: Field to sort by.
- `-s, --search <string>`: Search term.

### Examples

```bash
# Fetch all revisions of a variable
keyshade variable revisions variable-1 --environment dev

# Fetch with pagination options
keyshade variable revisions variable-1 --environment dev --page 1 --limit 10
```

## `rollback`

### Usage

```bash
keyshade variable rollback <variable-slug> [options]
```

### Arguments

These are the arguments supported by the rollback command:

#### `<variable-slug>`

The slug of the variable that you want to rollback.

### Options

These are the options supported by the `rollback` command:

#### `-v, --version <string>`

Version of the variable to which you want to rollback.

#### `-e, --environment <string>`

Slug of the environment of the variable to which you want to rollback.

### Examples

```bash
# Rollback a variable
keyshade variable rollback variable-1 --version 2 --environment dev
```

## `update`

### Usage

```bash
keyshade variable update <variable-slug> [options]
```

### Arguments

These are the arguments supported by the update command:

#### `<variable-slug>`

The slug of the variable that you want to update.

### Options

These are the options supported by the `update` command:

#### `-n, --name <string>`

The new name of the variable.

#### `-d, --note <string>`

An optional note describing the usage of the variable.

#### `-e, --entry [entries...]`

An array of values for the variable. If specified, should be in the form `<environment slug>=<value>`.

### Examples

```bash
# Update variable's name and note
keyshade variable update variable-1 --name "My Variable" --note "This is a variable"

# Add more entries to a variable
keyshade variable update port-1 --entry "dev=3000" "prod=8080"
```

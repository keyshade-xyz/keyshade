---
description: The `workspace` command
---

# `workspace`

The `workspace` command is used to manage workspaces on keyshade. A workspace is a collection of projects, environments, secrets, variables, and roles. It has a set of subcommands:

- [`create`](#create): This command is used to create a new workspace.
- [`delete`](#delete): This command is used to delete an existing workspace.
- [`export`](#export): This command is used to export all projects, environments, secrets, variables, and roles of a workspace into JSON format.
- [`get`](#get): This command is used to fetch a particular workspace.
- [`list`](#list): This command is used to fetch all the workspaces you have access to.
- [`search`](#search): This command is used to perform a full-text search for projects, secrets, variables, and environments in a workspace.
- [`update`](#update): This command is used to update an existing workspace.

## Usage

```bash
keyshade workspace <subcommand> [options]
```

## `create`

### Usage

```bash
keyshade workspace create [options]
```

### Options

These are the options supported by the `create` command:

#### `-n, --name <name>`

The name of the workspace. This is a required field.<br>
If the name is not provided via the command line option, the user will be prompted to enter it interactively.

#### `-i, --icon <icon>`

The icon to be used for this workspace (optional).

## `delete`

### Usage

```bash
keyshade workspace delete <workspace slug>
```

### Arguments

These are the arguments supported by the `delete` command:

#### `<workspace slug>`

Slug of the workspace which you want to delete.

## `export`

### Usage

```bash
keyshade workspace export <workspace slug> [options]
```

### Arguments

These are the arguments supported by the `export` command:

#### `<workspace slug>`

Slug of the workspace which you want to export.

### Options

These are the options supported by the `export` command:

#### `-s, --save-to-file <file>`

Saves the exported data to a file. If not provided, the data will be printed to the console.

## `get`

### Usage

```bash
keyshade workspace get <workspace slug>
```

### Arguments

These are the arguments supported by the `get` command:

#### `<workspace slug>`

The slug of the workspace you want to fetch.

## `list`

### Usage

```bash
keyshade workspace list [options]
```

### Options

These are the options supported by the `list` command:

#### `-p, --page <int>`

Index of the page.

#### `-l, --limit <int>`

Total number of items per page.

#### `-o, --order <string>`

Order to sort by - either ascending (ASC) or descending (DESC).

#### `--sort, --sort <string>`

Field to sort by.

#### `-s, --search <string>`

Search term.

## `search`

### Usage

```bash
keyshade workspace search <workspace slug> <search term>
```

### Arguments

These are the arguments supported by the `search` command:

#### `<workspace slug>`

Slug of the workspace which you want to search for.

#### `<search term>`

The search term you want to use for searching.

## `update`

### `Usage`

```bash
keyshade workspace update <workspace slug> [options]
```

### Arguments

These are the arguments supported by the `update` command:

#### `<workspace slug>`

The slug of the workspace you want to update.

### Options

These are the options supported by the `update` command:

#### `-n, --name <name>`

The new name for the workspace.

#### `-i, --icon <icon>`

The new icon for the workspace.

At least one of the options (name or icon) must be provided to perform an update.

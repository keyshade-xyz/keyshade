---
description: The `project` command
---

# `project`

The `project` command is used to manage projects within a workspace in Keyshade. It provides various subcommands to perform different operations on projects.

## Usage

```bash
keyshade project <subcommand> [options]
```

## Subcommands

The `project` command includes the following subcommands:

- [`create`](#create): Create a new project.
- [`delete`](#delete): Delete an existing project.
- [`fork`](#fork): Fork an existing project.
- [`get`](#get): Get details of a specific project.
- [`list-forks`](#list-forks): List all forks of a project.
- [`list`](#list): List all projects in a workspace.
- [`sync`](#sync): Synchronize a project with its parent.
- [`unlink`](#unlink): Unlink a project from its parent.
- [`update`](#update): Update the properties of an existing project.

## `create`

### Usage

```bash
keyshade project create <workspace-slug> [options]
```

### Arguments

These are the arguments supported by the create command:

#### `<workspace-slug>`

The slug of the workspace under which you want to create the project.

### Options

These are the options supported by the `create` command:

#### `-n, --name <string>`

The name of the project.

#### `-d, --description <string>`

Description of the project. Defaults to project name.

#### `-k, --store-private-key`

Store the private key in the project. Defaults to true.

#### `-a, --access-level <string>`

Access level of the project. Defaults to PRIVATE. Choices are GLOBAL, PRIVATE, INTERNAL.

## `delete`

### Usage

```bash
keyshade project delete <project-slug> [options]
```

### Arguments

These are the arguments supported by the `delete` command:

#### `<project-slug>`

The slug of the project that you want to delete.

## `fork`

### Usage

```bash
keyshade project fork <project-slug> [options]
```

### Arguments

These are the arguments supported by the fork command:

#### `<project-slug>`

The slug of the project under which you want to fork.

### Options

These are the options supported by the `fork` command:

#### `-n, --name <workspace-name>`

The name of the workspace.

#### `-k, --store-private-key <boolean>`

Store the private key in the project. Defaults to true.

#### `-w, --workspace <string>`

Workspace slug to fork the project in

## `get`

### Usage

```bash
keyshade project get <project-slug> [options]
```

### Arguments

These are the arguments supported by the `get` command:

#### `<project-slug>`

The slug of the project which you want to fetch.

## `list-forks`

### Usage

```bash
keyshade project list-forks <project-slug> [options]
```

### Arguments

These are the arguments supported by the `list-forks` command:

#### `<project-slug>`

The slug of the project whose forks you want to list.

## `list`

### Usage

```bash
keyshade project list <workspace-slug> [options]
```

### Arguments

These are the arguments supported by the `list` command:

#### `<workspace-slug>`

The slug of the project whose projects you want.

## `sync`

### Usage

```bash
keyshade project sync <project-slug> [options]
```

### Arguments

These are the arguments supported by the sync command:

#### `<project-slug>`

The slug of the forked project that you want to sync with its parent.

### Options

These are the options supported by the `sync` command:

#### `-h, --hard-sync`

Upserts a new copy of the parent onto the child. Defaults to soft sync.

## `unlink`

### Usage

```bash
keyshade project unlink <project-slug> [options]
```

### Arguments

These are the arguments supported by the unlink command:

#### `<project-slug>`

The slug of the forked project that you want to unlink from its parent.

## `update`

### Usage

```bash
keyshade project update <project-slug> [options]
```

### Arguments

These are the arguments supported by the update command:

#### `<project-slug>`

The slug of the project that you want to update.

### Options

These are the options supported by the `update` command:

#### `-n, --name <string>`

The name of the project.

#### `-d, --description <string>`

Description of the project. Defaults to project name.

#### `-k, --store-private-key`

Store the private key in the project. Defaults to true.

#### `-a, --access-level <string>`

Access level of the project. Defaults to PRIVATE. Choices are GLOBAL, PRIVATE, INTERNAL.

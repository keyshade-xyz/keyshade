---
description: The `environment` command
---

# `environment`

The `environment` command is used to manage environments in Keyshade. An environment is a context in which secrets are stored and accessed. It has a set of subcommands:

- [`create`](#create): This command is used to create a new environment.
- [`delete`](#delete): This command is used to delete an existing environment.
- [`get`](#get): This command is used to get details of a specific environment.
- [`list`](#list): This command is used to list all environments.
- [`update`](#update): This command is used to update the properties of an existing environment.

## Usage

```bash
keyshade environment <subcommand> [options]
```

## `create`

### Usage

```bash
keyshade environment create <project-slug> [options]
```

### Arguments

These are the arguments supported by the create command:

#### `<project-slug>`

The slug of the project under which you want to add the environment.

### Options

These are the options supported by the `create` command:

#### `-n, --name <string>`

The name of the environment.

#### `-d, --description <string>`

A description of the environment.

## `delete`

### Usage

```bash
keyshade environment delete <environment-id> [options]
```

### Arguments

These are the arguments supported by the delete command:

#### `<environment-id>`

The ID of the environment which you want to delete.

## `get`

### Usage

```bash
keyshade environment get <environment-slug> [options]
```

### Arguments

These are the arguments supported by the get command:

#### `<environment-slug>`

Slug of the environment which you want to fetch.

## `list`

### Usage

```bash
keyshade environment list <project-slug> [options]
```

### Arguments

These are the arguments supported by the list command:

#### `<project-slug>`

Slug of the project whose environments you want.

### Options

These are the options supported by the `list` command:

#### `PAGINATION_OPTION`

The `list` command supports pagination options. These options are defined in the `PAGINATION_OPTION` constant.

## `update`

### Usage

```bash
keyshade environment update <environment-slug> [options]
```

### Arguments

These are the arguments supported by the update command:

#### `<environment-slug>`

Slug of the environment which you want to update.

### Options

These are the options that might be supported by the `update` command:

#### `-n, --name <string>`

The new name for the environment.

#### `-d, --description <string>`

The new description for the environment.

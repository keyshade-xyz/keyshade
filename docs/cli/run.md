---
description: The `run` command
---

# `run`

The `run` command is used to run your application with live configuration updates from keyshade. All the secrets and variables are injected into your application as environment variables. This command reads the `keyshade.json` file in your project root by default, but you can override settings using runtime flags.

## Usage

```bash
keyshade run <command> [options]
```

## Arguments

These are the arguments supported by the `run` command:

### `<command>`

The command to run your application. This command is run in the same shell as the `keyshade run` command.

## Options

The `run` command supports the following options for runtime configuration overrides:

- `-e, --environment <slug>`  
  Override the environment at runtime. This allows you to run your application in a different environment without modifying your configuration file.

- `-w, --workspace <slug>`  
  Override the workspace at runtime. Useful when switching between different workspaces for the same project.

- `-p, --project <slug>`  
  Override the project at runtime. Allows connecting to a different project without updating the config file.

- `-f, --config-file <path>`  
  Specify a different configuration file instead of the default `keyshade.json`. Useful for maintaining different configurations for different environments.

### Flag Precedence

The flags follow this precedence order (highest to lowest):

1. **Runtime flags** (`-w`, `-p`, `-e`) - Always take precedence when specified
2. **Custom config file** (`-f`) - Used if no conflicting runtime flags are provided
3. **Default keyshade.json** - Used when no overrides are specified

## Examples

### Basic usage

Run with default `keyshade.json` configuration:

```bash
keyshade run "npm run dev"
```

### Override environment

Run with a different environment:

```bash
keyshade run --environment staging "npm run dev"
```

### Override multiple settings

Connect to a different project and environment:

```bash
keyshade run --project node-app-0 --environment dev-1 "npm start"
```

### Use custom config file

Run with a staging configuration file:

```bash
keyshade run --config-file keyshade.stage.json "npm run dev"
```

### Combine custom config with overrides

Use staging config but override the workspace:

```bash
keyshade run --workspace example-0 --config-file keyshade.stage.json "npm start"
```

## Use Cases

These runtime flags are particularly useful for:

- **CI/CD pipelines**: Different environments can use different configurations without modifying files
- **Multi-environment development**: Quickly switch between development, staging, and production
- **Team collaboration**: Different team members can use the same codebase with their own workspace/project settings
- **Environment-specific deployment**: Deploy to different environments using the same application code

You can also use any global flags with this command.

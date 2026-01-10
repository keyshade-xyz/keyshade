# Enhanced Keyshade CLI Configuration System

This document describes the enhanced configuration system implemented for the Keyshade CLI, specifically addressing [issue #1238](https://github.com/keyshade-xyz/keyshade/issues/1238).

## Overview

The enhanced configuration system provides a comprehensive set of features to improve the developer experience when working with Keyshade configurations:

- **Config file auto-discovery** - Automatically find configuration files in parent directories
- **Environment variable interpolation** - Use `${ENVVAR}` syntax in config files
- **Multiple config file merging** - Combine multiple configuration sources with clear precedence
- **Interactive configuration** - Prompt for missing values with fallback for CI environments
- **Enhanced validation** - Better error messages and field validation
- **Profile-based configs** - Named profiles for different environments
- **Global config override** - System-wide defaults that can be overridden per project
- **Configuration debugging** - Detailed information about config resolution
- **Dry-run mode** - Preview resolved configuration without execution

## Configuration Precedence (Highest to Lowest)

1. **Command line flags** (--workspace, --project, --environment)
2. **Profile configuration** (--profile flag)
3. **Local config files** (keyshade.json in current or parent directories)
4. **Global configuration** (~/.keyshade/global-config.json)

## New CLI Commands

### `keyshade config init`

Initialize a new configuration file with templates:

```bash
# Interactive template selection
keyshade config init

# Use specific template
keyshade config init --template production

# Custom output path
keyshade config init --template multi-profile --output ./config/keyshade.json
```

**Available templates:**
- `default` - Basic configuration with environment variables
- `production` - Production-ready with strict settings
- `multi-profile` - Multiple environment profiles

### `keyshade config validate`

Validate and show resolved configuration:

```bash
# Validate default configuration
keyshade config validate

# Validate specific config file
keyshade config validate --config-file ./custom-config.json

# Validate with profile
keyshade config validate --profile staging

# Show debug information
keyshade config validate --debug-config
```

### `keyshade config global`

Manage global configuration defaults:

```bash
# Set global defaults interactively
keyshade config global

# Clear global configuration
keyshade config global --clear
```

## Enhanced `keyshade run` Command

The run command now supports all new configuration features:

```bash
# Basic usage with auto-discovery
keyshade run npm start

# Use specific profile
keyshade run --profile production npm start

# Multiple config files (merged in order)
keyshade run --config-file base.json --config-file override.json npm start

# Dry-run to see resolved configuration
keyshade run --dry-run npm start

# Debug configuration resolution
keyshade run --debug-config npm start

# Non-interactive mode for CI
keyshade run --no-interactive npm start
```

## Configuration File Features

### Environment Variable Interpolation

Use `${ENVVAR}` syntax in configuration files:

```json
{
  "workspace": "${KEYSHADE_WORKSPACE}",
  "project": "${KEYSHADE_PROJECT}",
  "environment": "${NODE_ENV:-development}",
  "quitOnDecryptionFailure": false
}
```

**Supported syntax:**
- `${VAR}` - Required environment variable
- `${VAR:-default}` - Optional with default value

### Profile-Based Configuration

Define multiple profiles in a single configuration file:

```json
{
  "workspace": "my-company",
  "project": "my-app",
  "environment": "development",
  "quitOnDecryptionFailure": false,
  "profiles": {
    "dev": {
      "environment": "development",
      "quitOnDecryptionFailure": false
    },
    "staging": {
      "environment": "staging", 
      "quitOnDecryptionFailure": true
    },
    "prod": {
      "environment": "production",
      "quitOnDecryptionFailure": true
    }
  }
}
```

Usage:
```bash
keyshade run --profile dev npm start
keyshade run --profile staging npm run build
keyshade run --profile prod npm run production
```

### Global Configuration

Create system-wide defaults in `~/.keyshade/global-config.json`:

```json
{
  "workspace": "my-default-workspace",
  "quitOnDecryptionFailure": false
}
```

These values are used when not specified in local configurations.

## Configuration Auto-Discovery

The CLI automatically searches for `keyshade.json` files:

1. Current directory (`./keyshade.json`)
2. Parent directories (walking up the tree)
3. Stops at first found configuration file

This allows placing configuration files at project root while running commands from subdirectories.

## Interactive Configuration

When required values are missing, the CLI can prompt interactively:

```bash
# Will prompt for missing values
keyshade run npm start

# Skip prompts in CI environments
keyshade run --no-interactive npm start
```

The CLI includes validation for workspace, project, and environment names (alphanumeric, hyphens, underscores only).

## Error Handling and Validation

Enhanced error messages provide specific guidance:

- **Missing environment variables**: Clear indication of which variables need to be set
- **Invalid field formats**: Specific validation rules for each field
- **File not found**: Helpful suggestions for configuration file placement
- **Precedence conflicts**: Debug information showing which values came from which sources

## Debug and Troubleshooting

Use `--debug-config` to see detailed configuration resolution:

```bash
keyshade run --debug-config npm start
```

This shows:
- All configuration sources found
- Order of precedence
- Final resolved values
- Any interpolated environment variables

Use `--dry-run` to preview configuration without running commands:

```bash
keyshade run --dry-run npm start
```

## Migration Guide

### From Basic Configuration

Existing `keyshade.json` files work without changes. New features are opt-in.

### Environment Variables

Replace hardcoded values with environment variable interpolation:

**Before:**
```json
{
  "workspace": "production-workspace",
  "project": "my-project",
  "environment": "production"
}
```

**After:**
```json
{
  "workspace": "${WORKSPACE}",
  "project": "${PROJECT}",
  "environment": "${NODE_ENV:-development}"
}
```

### Multiple Environments

Use profiles instead of multiple config files:

**Before:** `keyshade-dev.json`, `keyshade-prod.json`

**After:** Single `keyshade.json` with profiles:
```json
{
  "workspace": "${WORKSPACE}",
  "project": "${PROJECT}",
  "environment": "development",
  "profiles": {
    "prod": { "environment": "production" }
  }
}
```

## Examples

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run with Keyshade
  env:
    KEYSHADE_WORKSPACE: ${{ vars.WORKSPACE }}
    KEYSHADE_PROJECT: ${{ vars.PROJECT }}  
    KEYSHADE_ENVIRONMENT: production
  run: keyshade run --no-interactive --profile prod npm run build
```

### Local Development

```bash
# .env file
KEYSHADE_WORKSPACE=my-workspace
KEYSHADE_PROJECT=my-project

# Run with auto-discovery and interactive prompts
keyshade run npm run dev
```

### Multi-Project Workspace

```bash
# Global config for shared workspace
keyshade config global
# Set: workspace=shared-workspace

# Project-specific configs
cd project-a && keyshade config init --template default
cd project-b && keyshade config init --template production
```

## Implementation Details

### Key Classes

- **`ConfigurationManager`** - Main class handling all configuration operations
- **`ResolvedConfig`** - Final configuration with source tracking
- **`ConfigSource`** - Individual configuration source with metadata

### Configuration Resolution Flow

1. Load global configuration
2. Auto-discover local configuration files
3. Apply profile configuration
4. Apply command-line flags
5. Merge with precedence rules
6. Interpolate environment variables
7. Validate configuration
8. Handle missing values (interactive/error)

### Error Handling Strategy

- Fail fast on critical errors (missing private keys, invalid formats)
- Warn on non-critical issues (missing optional config files)
- Provide actionable error messages with suggested fixes
- Support both interactive and non-interactive modes

This enhanced configuration system significantly improves the developer experience while maintaining backward compatibility with existing configurations.

---
description: The `scan` command
---

# `scan`

The `scan` command is used to detect any hardcoded secrets in your project files. It can scan specific files, only changed files, or all files in the project.

## Usage

```bash
keyshade scan [options]
```

## Options

These are the options supported by the `scan` command:

### `-f, --file <string>`

Scan a specific file.

Example:

```bash
keyshade scan -f path/to/your/file.js
```

### `-c, --current-changes`

Scan only the current changed files that are not committed.

Example:

```bash
keyshade scan -c
```

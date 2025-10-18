---
description: The `reset` command
---

# `reset`

The `reset` command clears the local Keyshade CLI profile cache. It overwrites the files stored under `~/.keyshade/default-profile.json` and `~/.keyshade/profiles.json` with empty JSON objects without modifying workspace or server-side data.

## Usage

```bash
keyshade reset [options]
```

Run the command interactively to confirm you want to wipe the local profiles:

```bash
keyshade reset
```

You can script it (for CI/CD) by skipping the confirmation prompt:

```bash
keyshade reset --yes
```

## Options

#### `-y, --yes`

Skip the confirmation prompt. Useful for non-interactive environments.

#### `-d, --dry-run`

Show which files would be reset without writing any changes.

## Notes

- The reset only affects files in your local home directory.
- The JSON files are recreated with file permissions set to `0600` if they do not already exist.
- If you do not pass `--yes`, the CLI uses an interactive prompt to confirm the reset before proceeding.

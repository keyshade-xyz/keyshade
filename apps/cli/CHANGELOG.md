# cli

## 2.0.0

### Major Changes

- Made things functional

## 2.0.1

### Patches

- Fixed invalid import issue

## 2.0.2

### Patches

- Added `keyshade` command

## 2.0.3

### Patches

- Updated build scripts

## 2.0.4

### Patches

- Fixed binary path in package.json

## 2.1.0

### Minor Changes

- Modified a lot of commands to use more options rather than arguments

## 2.2.0

### Minor Changes

- `project create` command now outputs public key, private key and access level upon success.

## 2.3.0

### Minor Changes

- Listing of environments and secrets made better
- Fixed incorrect error message while listing projects

## 2.4.0

### Minor Changes

- Profile name creation now supports \_ and - characters
- Polished the README file
- Support to specify environment name and description while creating a project
- Profile creation prompts users for all values if no option is set and shows default values
- Commands invoking API endpoints first check if the backend is reachable before executing the command

## Patches

- Fixed error when the CLI won't create `.keyshade` folder while initializing profiles on new devices
- Projects always had `--store-private-key` set to true despite providing a false value. Fixed this

## 2.5.0

### Minor Changes

- Add `keyshade workspace list-invitations` command to list all the invitations the user has to workspaces
- Added version flag (`keyshade -v` or `keyshade --version`) to display the current CLI version
- Error reports get sent to Sentry if metrics is enabled

## 2.5.1

### Patches

- `-v` flag replaced with `-V`
- Removed `keyshade secret get` command
- Updated `keyshade secret update` and `keyshade secret create` commands to include `-e/--entry` flag for specifying values to environments
- Formatted outputs of `keyshade secret list` and `keyshade secret revisions` commands
- Update `keyshade secret rollback` to check for missing environment or version
- Added usage examples in secret commands
- Removed `keyshade variable get` command
- Updated `keyshade variable update` and `keyshade variable create` commands to include `-e/--entry` flag for specifying values to environments
- Formatted outputs of `keyshade variable list` and `keyshade variable revisions` commands
- Update `keyshade variable rollback` to check for missing environment or version
- Added usage examples in variable commands

## 2.5.2

- Update error logging

## 2.5.3

### Minor Changes

- Added `keyshade workspace resend-invitation` command to resend an invitation to a user to join a workspace.

## 3.0.0-stage.0

## Major Changes

- Updated the private key file to store keys in format `workspace_project` instead of `workspace_project_environment`

### Minor Changes

- Added `keyshade config update` command to update the project-specific keyshade.json file
- Added `keyshade config private-key add` command to add a private key into ~/.keyshade/private-keys.json file
- Added `keyshade config private-key delete` command to remove a private key from ~/.keyshade/private-keys.json file
- Added `keyshade config private-key list` command to list all the private keys in ~/.keyshade/private-keys.json file
- Added `keyshade config private-key update` command to update the private key of a combo in ~/.keyshade/private-keys.json file

### Patches

- Hardcoded API base URL
- Updated pipeline to release stage builds. Can be installed using `pnpm add @keyshade/cli@stage`
- Add logging to denote config file creation

## 3.0.0

### Major Changes

- Updated the private key file to store keys in format `workspace_project` instead of `workspace_project_environment`

### Minor Changes

- Added `keyshade config update` command to update the project-specific keyshade.json file
- Added `keyshade config private-key add` command to add a private key into ~/.keyshade/private-keys.json file
- Added `keyshade config private-key delete` command to remove a private key from ~/.keyshade/private-keys.json file
- Added `keyshade config private-key list` command to list all the private keys in ~/.keyshade/private-keys.json file
- Added `keyshade config private-key update` command to update the private key of a combo in ~/.keyshade/private-keys.json file

### Patches

- Hardcoded API base URL
- Updated pipeline to release stage builds. Can be installed using `pnpm add @keyshade/cli@stage`
- Add logging to denote config file creation

## 3.0.1

- Critical release to make CI pass. No changes were introduced

## 3.0.2

### Patches

- `keyshade run` wouldn't decrypt secrets if the project didn't store the private key

## 3.1.0-stage.1

### Minor Changes

- Added `keyshade project export` command to export secrets and variables to a file

## 3.1.0-stage.2

### Patches

- Updated `Keyshade project import` command to allow user to secret secrets or variable after initial scan

## 3.1.0-stage.3

### Minor Changes

- Updated secret-related commands to decrypt secrets on local device ONLY
- `keyshade run` command decrypts all secrets locally
- Updated private key config to map to project slugs only, removing workspace slug

## 3.1.0

### Minor Changes

- Added `keyshade project export` command to export secrets and variables to a file
- Updated secret-related commands to decrypt secrets on local device ONLY
- `keyshade run` command decrypts all secrets locally
- Updated private key config to map to project slugs only, removing workspace slug

### Patches

- Updated `Keyshade project import` command to allow user to secret secrets or variable after initial scan

## 3.2.0-stage.1

## Minor Changes

- Added `keyshade integration` base command

## 3.2.0-stage.2

### Patches

- Updated `keyshade run` command to parse command without quotes
- Run command exits when the command passed is a one-time only command
- Updated `keyshade run` command to kill child command upon ctrl+c

## 3.2.0

### Minor Changes

- Added `keyshade integration` base command

### Patches

- Updated `keyshade run` command to parse command without quotes
- Run command exits when the command passed is a one-time only command
- Updated `keyshade run` command to kill child command upon ctrl+c

## 3.2.1-stage.1

### Patches

- Fixed decryption error on `keyshade secret list` and `keyshade secret revisions` commands

## 3.2.1-stage.2

### Minor Changes

- Updated `keyshade project import` to have better feedback
- Modified Logger functions and implement new table function, revamping cli outputs

## 3.2.1

### Minor Changes

- Updated `keyshade project import` to have better feedback
- Modified Logger functions and implement new table function, revamping cli outputs

### Patches

- Fixed decryption error on `keyshade secret list` and `keyshade secret revisions` commands

## 3.2.2-stage.1

### Minor Changes

- Added `-e/--environment` option to `keyshade run` command to override the environment configuration at runtime

## 3.2.2-stage.2

### Minor Changes

- Fixed error handling in run command and socket notifier that displayed [object Object]; errors are now properly formatted for clearer CLI output

# 3.2.2

### Minor Changes

- Added `-e/--environment` option to `keyshade run` command to override the environment configuration at runtime
- Fixed error handling in run command and socket notifier that displayed [object Object]; errors are now properly formatted for clearer CLI output

# 3.2.3-stage.1

### Minor Changes

- Added request and response validation to `keyshade environment` subcommands

# 3.2.3-stage.2

### Minor Changes

- Removed email preference parsing in `keyshade init` command

# 3.2.3

### Minor Changes

- Added request and response validation to `keyshade environment` subcommands
- Removed email preference parsing in `keyshade init` command

# 3.3.0-stage.1

### Minor Changes

- Interactive mode for `keyshade run` command

### Patches

- `keyshade init` no longer overwrites existing private-keys.json file.

# 3.3.0-stage.3

### Minor Changes

- Interactive code for `keyshade init` command

# 3.4.0-stage.1

- `keyshade login` command added to support interactive login
- `keyshade profile create, delete, use` commands deleted
- `keyshade profile list` command updated
- `keyshade profile switch` allows users to switch between profiles
- `keyshade profile remove` allows users to remove a profile, and log out of the CLI session in the backend

# 3.4.0

### Features

- `keyshade login` command added to support interactive login
- `keyshade profile create, delete, use` commands deleted
- `keyshade profile list` command updated
- `keyshade profile switch` allows users to switch between profiles
- `keyshade profile remove` allows users to remove a profile, and log out of the CLI session in the backend
- 
### Minor Changes

- Interactive code for `keyshade init` command
- Interactive mode for `keyshade run` command

### Patches

- `keyshade init` no longer overwrites existing private-keys.json file.

# 3.4.1.stage-1

### Patches

- Removed API key validation from `keyshade run`
- Fixed invalid field referencing in variable, and secret commands

# 3.5.0.stage-1

### Minor changes

- Improved DX of `keyshade run` command

# 3.5.0

### Minor changes

- Improved DX of `keyshade run` command

### Patches

- Removed API key validation from `keyshade run`
- Fixed invalid field referencing in variable, and secret commands

# 3.5.1

## Patches

- Update domain to keyshade.io

# 3.5.2

## Patches

- Update URL retrival in login command

# 3.5.3

## Patches

- Updated `keyshade run` command to use POSIX
- `keyshade run` command now compatible with both Windows and Unix/Linux

# 3.6.0-stage.1

## Minor Changes

- Added `keyshade pat` base command
- Added `keyshade pat create` command
- Added `keyshade pat list` command
- Added `keyshade pat delete` command
- Added `keyshade pat update` command
- Added `keyshade pat regenerate` command

# 3.6.0-stage.2

## Minor Changes

- Added `keyshade import` command
- Improved efficiency of bulk import
- Removed `keyshade project import` command

## 3.6.0-stage.3

## Minor Changes

- Added `keyshade reset` to wipe local profile configuration files.

## 3.6.0

### Minor Changes

- Added `keyshade pat` base command
- Added `keyshade pat create` command
- Added `keyshade pat list` command
- Added `keyshade pat delete` command
- Added `keyshade pat update` command
- Added `keyshade pat regenerate` command
- Added `keyshade import` command
- Improved efficiency of bulk import
- Removed `keyshade project import` command
- Added `keyshade reset` to wipe local profile configuration files.

## 3.6.1-stage.0

### Bug Fixes

- Remove sentry dependency
- Remove error reporting

## 3.6.1

### Bug Fixes

- Remove sentry dependency
- Remove error reporting

## 3.6.2-stage.1

### Patches

- Update the name of the command to always display `keyshade`

## 3.6.3

### Patches

- Update the name of the command to always display `keyshade`

## 3.6.4

### Patches

- Fix a bug where all command names were switched to `keyshade` 
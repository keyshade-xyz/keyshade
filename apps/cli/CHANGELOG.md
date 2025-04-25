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

## Minor Changes

- Added `keyshade config update` command to update the project-specific keyshade.json file
- Added `keyshade config private-key add` command to add a private key into ~/.keyshade/private-keys.json file
- Added `keyshade config private-key delete` command to remove a private key from ~/.keyshade/private-keys.json file
- Added `keyshade config private-key list` command to list all the private keys in ~/.keyshade/private-keys.json file
- Added `keyshade config private-key update` command to update the private key of a combo in ~/.keyshade/private-keys.json file

## Patches

- Hardcoded API base URL
- Updated pipeline to release stage builds. Can be installed using `pnpm add @keyshade/cli@stage`
- Add logging to denote config file creation

## 3.0.0

## Major Changes

- Updated the private key file to store keys in format `workspace_project` instead of `workspace_project_environment`

## Minor Changes

- Added `keyshade config update` command to update the project-specific keyshade.json file
- Added `keyshade config private-key add` command to add a private key into ~/.keyshade/private-keys.json file
- Added `keyshade config private-key delete` command to remove a private key from ~/.keyshade/private-keys.json file
- Added `keyshade config private-key list` command to list all the private keys in ~/.keyshade/private-keys.json file
- Added `keyshade config private-key update` command to update the private key of a combo in ~/.keyshade/private-keys.json file

## Patches

- Hardcoded API base URL
- Updated pipeline to release stage builds. Can be installed using `pnpm add @keyshade/cli@stage`
- Add logging to denote config file creation

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
- Projects always had `--store-private-key` set to true despite providing a false value. Fixed this.

---
description: An insight into how our codebase is organized
---

# Organization of our code

In this section, we will discuss how our codebase is organized. We have tried to keep the codebase as modular as possible to make it easier for developers to understand and contribute to the project. Here are the packages, sub-packages, and how they all contribute to the project.

## Packages under `apps` directory

The `apps` directory contains all the applications that are part of the project. Each application is a separate package and has its own `package.json` file. The applications are:

- [**`api`**](../../../apps/api/): The main API server that serves the REST API.
- [**`web`**](../../../apps/web/): The web application that serves the homepage.
- [**`platform`**](../../../apps/workspace/): The platform application hosts the UI that allows users to do the actual work.

## Packages under `packages` directory

The `packages` directory contains all the shared packages that are used across the applications. These packages are:

- [**`eslint-config-custom`**](../../../packages/eslint-config-custom/): Contains the custom ESLint configuration for the project.
- [**`tsconfig`**](../../../packages/tsconfig/): Contains the custom TypeScript configuration for the project.

Apart from the `package.json` files used in the individual packages, we also have a root level `package.json` file that contains the scripts to run the applications and the shared packages. This file also contains the dependencies that are shared across the applications.

---
description: Instructions on how to build & run each part of keyshade using docker
---

# Docker Support

This document provides instructions on how to build and run our applications using Docker.

## Prerequisites

- Docker must be installed on your system.

## Available Applications

We have Docker support for the following applications:

1. Web Application
2. API
3. Platform

## Building and Running Applications

### Environment Variables

All applications use environment variables from a `.env` file. Ensure this file is present in your project root directory with the necessary configurations.

### Starting and Stopping Services

For a quick way to start up all containers(Web, API and Platform) you can simply run:

```bash
docker compose up -d
```

To stop and remove all services:

```bash
docker compose down
```

### Web Application

To build the web application:

```bash
pnpm docker:build:web
```

To run the web application:

```bash
pnpm docker:run:web
```

### API

To build the API:

```bash
pnpm docker:build:api
```

To run the API:

```bash
pnpm docker:run:api
```

### Platform

To build the platform:

```bash
pnpm docker:build:platform
```

To run the platform:

```bash
pnpm docker:run:platform
```

## Port Usage

The applications use the following ports by default:

- Web Application: 3000
- API: 4200
- Platform: 3025

Ensure these ports are available on your system. If you need to use different ports, you can modify the port mappings in the `package.json` file locally.

For more detailed information about Docker usage, refer to the official Docker documentation.

---
description: Design of our API
---

# API

This document covers how we have developed our API, the stacks, and things you should know before you get started with it!

## Stack

Our API is developed using the following stack:

* **NestJS** as the base
* **Prisma** as the DDL and DML
* **Node Mailer** as the mail agent

## Structure

As per the NestJS convention, our API base is totally modularized, with each module catering to a particular part of our project. The general module structure is as follows:

* **controller**: Stores the APIs that the clients will be interacting with.
* **service**: Holds the business logic
* **misc**: Holds utility functions and classes localized to the particular module
* **dto**: Contains class objects for data intake from the clients
* **types:** Optionally, some modules have a \`\<module\_name>.types.ts\` file that holds the custom types it uses in the module.

## The common module

Just so that we can employ code reusability without much OOP hassle, we have clustered all of our usable components of the backend under the `common` module.&#x20;

### The `prisma` module

This module deserves special attention since it deals with the data layer. Apart from the usual files, we have two other:

* `schema.prisma`: This contains the data definition
* `migrations`: This folder stores the migrations generated by running the `pnpm run db:generate-migrations` command. These migrations are the state that the current prisma database is in.&#x20;
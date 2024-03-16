---
description: Get to know the environment you are working with
---

# Environment Variables

## .env.example

Here's the description of the environment variables used in the project. You can find the values for these variables in \`.env.example\`.

* **DATABASE\_URL**: The URL of the PSQL database to connect to. This is used by the [Prisma Client](https://www.prisma.io/docs/orm/prisma-client) to connect to the database.
* **SMTP\_HOST**: This is used to send out emails from the backend.&#x20;
* **SMTP\_PORT:** The SMTP port as specified by your SMTP provider.
* **SMTP\_EMAIL\_ADDRESS:** The email address you want to be sending out the emails from.
* **SMTP\_PASSWORD:** The app password for your email account. &#x20;
* **GITHUB\_CLIENT\_ID, GITHUB\_CLIENT\_SECRET, GITHUB\_CALLBACK\_URL:** These settings can be configured by adding an OAuth app in your GitHub account's developer section. Please note that it's not mandatory, until and unless you want to support GitHub OAuth.
* **SENTRY\_DSN**: The Data Source Name (DSN) for Sentry, a platform for monitoring, troubleshooting, and resolving issues in real-time. This is used to configure error tracking in the project.
* **SENTRY\_ORG**: The organization ID associated with your Sentry account.
* **SENTRY\_PROJECT**: The project ID within your Sentry organization where events will be reported.
* **SENTRY\_TRACES\_SAMPLE\_RATE**: The sample rate for collecting transaction traces in Sentry. It determines the percentage of transactions to capture traces for.
* **SENTRY\_PROFILES\_SAMPLE\_RATE**: The sample rate for collecting performance profiles in Sentry. It determines the percentage of requests to capture performance profiles for.
* **SENTRY\_ENV**: The The environment in which the app is running. It can be either 'development', 'production', or 'test'. Please note that it's not mandatory, it will default to "production" enviroment for the sentry configuration. 
* **FROM\_EMAIL**: The display of the email sender title.
* **JWT\_SECRET**: The secret used to sign the JWT tokens. It is insignificant in the development environment.
* **WEB\_FRONTEND\_URL, WORKSPACE\_FRONTEND\_URL**: The URLs of the web and workspace frontend respectively. These are used in the emails sometimes and in other spaces of the application too.

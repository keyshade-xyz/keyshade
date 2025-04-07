---
description: Get to know the environment you are working with
---

# Environment Variables

In order to run our application properly, we will need to set up some environment variables. These variables are used to configure the application and are used to connect to various services like the database, SMTP server, OAuth providers, etc.

The environmental variables are split into two parts: Required and Optional variables. The required variables are necessary for the application to run, while the optional variables, if specified, trigger the initialization of certain services.

## .env.example

Here's the description of the environment variables used in the project. You can find the values for these variables in \`.env.example\`.

### Required

- **DATABASE_URL**: The URL of the PSQL database to connect to. This is used by the [Prisma Client](https://www.prisma.io/docs/orm/prisma-client) to connect to the database.
- **SMTP_HOST**: This is used to send out emails from the backend.&#x20;
- **SMTP_PORT:** The SMTP port as specified by your SMTP provider.
- **SMTP_SECURE:** The SMTP security as specified by your SMTP client, By default `false`, for local development/testing. Set to `true` for real SMTP servers which support SSL/TLS e.g. in production.
- **SMTP_EMAIL_ADDRESS:** The email address you want to be sending out the emails from.
- **SMTP_PASSWORD:** The app password for your email account. &#x20;
- **JWT_SECRET**: The secret used to sign the JWT tokens. It is insignificant in the development environment.
- **WEB_FRONTEND_URL, PLATFORM_FRONTEND_URL**: The URLs of the web and platform frontend respectively. These are used in the emails sometimes and in other spaces of the application too.
- **API_PORT**: The environmental variable that specifies the port number on which the API server should listen for incoming connections. If not explicitly set, it defaults to port 4200.
- **REDIS_URL**: The required parameter URL that is used by the API to connect to the Redis instance.
- **FEEDBACK_FORWARD_EMAIL**: Feedbacks submitted by the user would be sent to this email address for the concerned authorities to view it. Ideally, in development environment, this would be your personal email address
- **NEXT_PUBLIC_BACKEND_URL**: The URL of the backend server. This is used by the frontend to make API requests to the backend.
- **FROM_EMAIL**: The display of the email sender title.

### Optional

- **GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL:** These settings can be configured by adding an OAuth app in your GitHub account's developer section. Please note that it's not mandatory, until and unless you want to support GitHub OAuth.
- **GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL:** These settings can be configured by adding an OAuth app in your Google account's cloud platform. Please note that it's not mandatory, until and unless you want to support Google OAuth.
- **GITLAB_CLIENT_ID, GITLAB_CLIENT_SECRET, GITLAB_CALLBACK_URL:** These settings can be configured by adding an OAuth app in your GitLab account's application section. Please note that it's not mandatory, until and unless you want to support GitLab OAuth.
- **SENTRY_ORG**: The organization ID associated with your Sentry account.
- **SENTRY_API_ENVIRONMENT, NEXT_PUBLIC_SENTRY_ENVIRONMENT**: The environment in which the app is running. It can be either 'development', 'production', or 'test'. Please note that it's not mandatory, it will default to "production" environment for the sentry configuration.
- **SENTRY_API_DSN**: The Data Source Name (DSN) for Sentry API, a platform for monitoring, troubleshooting, and resolving issues in real-time. This is used to configure error tracking in the project.
- **SENTRY_API_TRACES_SAMPLE_RATE**: The sample rate for collecting transaction traces in Sentry API. It determines the percentage of transactions to capture traces for.
- **SENTRY_API_PROFILES_SAMPLE_RATE**: The sample rate for collecting performance profiles in Sentry API. It determines the percentage of requests to capture performance profiles for.
- **NEXT_PUBLIC_SENTRY_WEB_DSN**: The Data Source Name (DSN) for Sentry WEB, a platform for monitoring, troubleshooting, and resolving issues in real-time. This is used to configure error tracking in the project.
- **NEXT_PUBLIC_SENTRY_WEB_TRACES_SAMPLE_RATE**: The sample rate for collecting transaction traces in Sentry WEB. It determines the percentage of transactions to capture traces for.
- **NEXT_PUBLIC_SENTRY_WEB_PROFILES_SAMPLE_RATE**: The sample rate for collecting performance profiles in Sentry WEB. It determines the percentage of requests to capture performance profiles for.
- **NEXT_PUBLIC_SENTRY_PLATFORM_DSN**: The Data Source Name (DSN) for Sentry PLATFORM, a platform for monitoring, troubleshooting, and resolving issues in real-time. This is used to configure error tracking in the project.
- **NEXT_PUBLIC_SENTRY_PLATFORM_TRACES_SAMPLE_RATE**: The sample rate for collecting transaction traces in Sentry PLATFORM. It determines the percentage of transactions to capture traces for.
- **NEXT_PUBLIC_SENTRY_PLATFORM_PROFILES_SAMPLE_RATE**: The sample rate for collecting performance profiles in Sentry PLATFORM. It determines the percentage of requests to capture performance profiles for.
- **SENTRY_CLI_DSN**: The Data Source Name (DSN) for Sentry CLI, a platform for monitoring, troubleshooting, and resolving issues in real-time. This is used to configure error tracking in the project.
- **SENTRY_CLI_TRACES_SAMPLE_RATE**: The sample rate for collecting transaction traces in Sentry CLI. It determines the percentage of transactions to capture traces for.
- **SENTRY_CLI_PROFILES_SAMPLE_RATE**: The sample rate for collecting performance profiles in Sentry CLI. It determines the percentage of requests to capture performance profiles for.
- **MINIO_ENDPOINT**: This is the endpoint of the Minio server. Minio is an open-source object storage server.
- **MINIO_PORT**: The port on which the Minio server is running.
- **MINIO_ACCESS_KEY**: The access key to the Minio server.
- **MINIO_SECRET_KEY**: The secret key to the Minio server.
- **MINIO_USE_SSL**: Whether to use SSL for the Minio connection or not.
- **MINIO_BUCKET_NAME**: The name of the bucket in the Minio server where the files are stored.
- **NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID**: The measurement ID of the Google Analytics account.

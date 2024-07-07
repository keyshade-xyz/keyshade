---
description: Get to know the environment you are working with
---

# Environment Variables

## .env.example

Here's the description of the environment variables used in the project. You can find the values for these variables in \`.env.example\`.

- **DATABASE_URL**: The URL of the PSQL database to connect to. This is used by the [Prisma Client](https://www.prisma.io/docs/orm/prisma-client) to connect to the database.
- **SMTP_HOST**: This is used to send out emails from the backend.&#x20;
- **SMTP_PORT:** The SMTP port as specified by your SMTP provider.
- **SMTP_EMAIL_ADDRESS:** The email address you want to be sending out the emails from.
- **SMTP_PASSWORD:** The app password for your email account. &#x20;
- **GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL:** These settings can be configured by adding an OAuth app in your GitHub account's developer section. Please note that it's not mandatory, until and unless you want to support GitHub OAuth.
- **GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL:** These settings can be configured by adding an OAuth app in your Google account's cloud platform. Please note that it's not mandatory, until and unless you want to support Google OAuth.
- **GITLAB_CLIENT_ID, GITLAB_CLIENT_SECRET, GITLAB_CALLBACK_URL:** These settings can be configured by adding an OAuth app in your GitLab account's application section. Please note that it's not mandatory, until and unless you want to support GitLab OAuth.
- **SENTRY_DSN**: The Data Source Name (DSN) for Sentry, a platform for monitoring, troubleshooting, and resolving issues in real-time. This is used to configure error tracking in the project.
- **SENTRY_ORG**: The organization ID associated with your Sentry account.
- **SENTRY_PROJECT**: The project ID within your Sentry organization where events will be reported.
- **SENTRY_TRACES_SAMPLE_RATE**: The sample rate for collecting transaction traces in Sentry. It determines the percentage of transactions to capture traces for.
- **SENTRY_PROFILES_SAMPLE_RATE**: The sample rate for collecting performance profiles in Sentry. It determines the percentage of requests to capture performance profiles for.
- **SENTRY_ENV**: The environment in which the app is running. It can be either 'development', 'production', or 'test'. Please note that it's not mandatory, it will default to "production" enviroment for the sentry configuration.
- **FROM_EMAIL**: The display of the email sender title.
- **JWT_SECRET**: The secret used to sign the JWT tokens. It is insignificant in the development environment.
- **WEB_FRONTEND_URL, WORKSPACE_FRONTEND_URL**: The URLs of the web and workspace frontend respectively. These are used in the emails sometimes and in other spaces of the application too.
- **API_PORT**: The environmental variable that specifies the port number on which the API server should listen for incoming connections. If not explicitly set, it defaults to port 4200.

- **MINIO_ENDPOINT**: This is the endpoint of the Minio server. Minio is an open-source object storage server.
- **MINIO_PORT**: The port on which the Minio server is running.
- **MINIO_ACCESS_KEY**: The access key to the Minio server.
- **MINIO_SECRET_KEY**: The secret key to the Minio server.
- **MINIO_USE_SSL**: Whether to use SSL for the Minio connection or not.
- **MINIO_BUCKET_NAME**: The name of the bucket in the Minio server where the files are stored.
- **REDIS_URL**: The required parameter URL that is used by the API to connect to the Redis instance.
- **REDIS_PASSWORD**: The optional parameter that is used by the API. This is specified only if the Redis instance is configured to use a password.

- **FEEDBACK_FORWARD_EMAIL**: Feedbacks submitted by the user would be sent to this email address for the concerned authorities to view it. Ideally, in development environment, this would be your personal email address

- **NEXT_PUBLIC_BACKEND_URL**: The URL of the backend server. This is used by the frontend to make API requests to the backend.

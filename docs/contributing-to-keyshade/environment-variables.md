---
description: Get to know the environment you are working with
---

# Environment Variables

## .env.example

Here's the description of the environment variables used in the project. You can find the values for these variables in \`.env.example\`.

* **DATABASE\_URL**: The URL of the PSQL database to connect to. This is used by the [Prisma Client](https://www.prisma.io/docs/orm/prisma-client) to connect to the database.
* **SUPABASE\_API\_URL**: The URL of the Supabase API. This is used by the [Supabase Client](https://supabase.io/docs/reference/javascript/supabase-client) to connect to the Supabase API. Make sure you create a Supabase project and get the API URL from the project settings.
* **SUPABASE\_ANON\_KEY**: The anonymous key of the Supabase project. This is used by the Supabase Client to connect to the Supabase API. Make sure you create a Supabase project and get the anonymous key from the project settings.
* **SMTP\_HOST**: This is used to send out emails from the backend.&#x20;
* **SMTP\_PORT:** The SMPT port as specified by your SMPT provider.
* **SMTP\_EMAIL\_ADDRESS:** The email address you want to be sending out the emails from.
* **SMTP\_PASSWORD:** The app password for your email account. &#x20;
* **FROM\_EMAIL**: The display of the email sender title.
* **JWT\_SECRET**: The secret used to sign the JWT tokens. It is insignificant in the development environment.
* **WEB\_FRONTEND\_URL, WORKSPACE\_FRONTEND\_URL**: The URLs of the web and workspace frontend respectively. These are used in the emails sometimes and in other spaces of the application too.

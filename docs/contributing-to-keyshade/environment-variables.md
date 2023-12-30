---
description: Get to know the environment you are working with
---

# Environment Variables

## .env.example

Here's the description of the environment variables used in the project. You can find the values for these variables in \`.env.example\`.

* **DATABASE\_URL**: The URL of the PSQL database to connect to. This is used by the [Prisma Client](https://www.prisma.io/docs/orm/prisma-client) to connect to the database.
* **SUPABASE\_API\_URL**: The URL of the Supabase API. This is used by the [Supabase Client](https://supabase.io/docs/reference/javascript/supabase-client) to connect to the Supabase API. Make sure you create a Supabase project and get the API URL from the project settings.
* **SUPABASE\_ANON\_KEY**: The anonymous key of the Supabase project. This is used by the Supabase Client to connect to the Supabase API. Make sure you create a Supabase project and get the anonymous key from the project settings.
* **RESEND\_API\_KEY**: The API key for the [Resend API](https://resend-api.vercel.app/). The project uses Resend API to send out emails.
* **JWT\_SECRET**: The secret used to sign the JWT tokens. It is insignificant in the development environment.
* **FROM\_EMAIL**: The email address from which the emails will be sent. This is used by the Resend API to send out emails.
* **WEB\_FRONTEND\_URL, WORKSPACE\_FRONTEND\_URL**: The URLs of the web and workspace frontend respectively. These are used in the emails sometimes and in other spaces of the application too.

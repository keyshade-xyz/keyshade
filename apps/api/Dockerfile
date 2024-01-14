FROM node:20-alpine as build

# ENVs here are for reference only, don't put secrets here

# ENV DATABASE_URL=
# ENV SUPABASE_API_URL=
# ENV SUPABASE_ANON_KEY=

# ENV SMTP_HOST=
# ENV SMTP_PORT=
# ENV SMTP_EMAIL_ADDRESS=
# ENV SMTP_PASSWORD=
# ENV FROM_EMAIL=

# ENV JWT_SECRET=secret

# ENV WEB_FRONTEND_URL=https://keyshade.xyz
# ENV WORKSPACE_FRONTEND_URL=https://app.keyshade.xyz

WORKDIR /app

RUN npm i -g pnpm

COPY package.json .
COPY tsconfig.base.json .

RUN pnpm install

COPY apps/api apps/api

RUN pnpm run db:generate-types
RUN pnpm run build:api

EXPOSE 4200

ENTRYPOINT ["pnpm", "run", "start:api"]
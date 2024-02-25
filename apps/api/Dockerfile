FROM node:20-alpine AS build

WORKDIR /app

ARG SENTRY_ORG=${SENTRY_ORG}
ARG SENTRY_PROJECT=${SENTRY_PROJECT}
ARG SENTRY_ENVIRONMENT=${SENTRY_ENVIRONMENT}
ARG SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ARG DATABASE_URL=${DATABASE_URL}

RUN npm i -g pnpm

COPY package.json .
COPY turbo.json .
COPY pnpm-workspace.yaml . 

COPY apps/api/package.json apps/api/package.json
COPY apps/api/tsconfig.json apps/api/tsconfig.json

COPY apps/api/src apps/api/src

COPY packages packages

RUN pnpm install

RUN pnpm db:generate-types
RUN pnpm build:api
RUN pnpm sourcemaps:api

EXPOSE 4200

ENTRYPOINT ["node", "apps/api/dist/main.js"]
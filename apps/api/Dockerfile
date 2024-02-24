FROM node:20-alpine AS build

WORKDIR /app

ARG SENTRY_ORG=${SENTRY_ORG}
ARG SENTRY_PROJECT=${SENTRY_PROJECT}
ARG SENTRY_ENVIRONMENT=${SENTRY_ENVIRONMENT}
ARG SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ARG DATABASE_URL=${DATABASE_URL}

RUN apk add --no-cache bash
RUN npm i -g pnpm

COPY package.json .
COPY turbo.json .
COPY pnpm-workspace.yaml . 

COPY apps/api/package.json apps/api/package.json
COPY apps/api/tsconfig.json apps/api/tsconfig.json

COPY packages packages

RUN pnpm install

RUN cd apps/api && pnpm install
RUN cd ../../

COPY apps/api apps/api

RUN pnpm db:generate-types
RUN pnpm build:api
# RUN pnpm sourcemaps:api
RUN pnpm db:deploy-migrations

FROM node:20-alpine as production

WORKDIR /app

COPY --from=build /app/apps/api/dist/ /app

EXPOSE 4200

ENTRYPOINT ["node" "dist/main"]
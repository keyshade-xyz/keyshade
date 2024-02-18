FROM node:20-alpine AS build

WORKDIR /app

RUN apk add --no-cache bash
RUN npm i -g pnpm

COPY package.json .
COPY tsconfig.base.json .

RUN pnpm install

COPY apps/api apps/api

COPY apps/api/startup.sh .
RUN chmod +x startup.sh

ARG SENTRY_ORG=${SENTRY_ORG}
ARG SENTRY_PROJECT=${SENTRY_PROJECT}
ARG SENTRY_ENVIRONMENT=${SENTRY_ENVIRONMENT}
ARG SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}

RUN pnpm run db:generate-types
RUN pnpm run build:api

EXPOSE 4200

ENTRYPOINT ["/bin/bash", "startup.sh"]
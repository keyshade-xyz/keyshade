FROM node:20.0.0-alpine AS build

WORKDIR /app

ARG SENTRY_ORG=${SENTRY_ORG}
ARG SENTRY_PROJECT=${SENTRY_PROJECT}
ARG SENTRY_ENVIRONMENT=${SENTRY_ENVIRONMENT}
ARG SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ARG DATABASE_URL=${DATABASE_URL}

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY --chown=node:node package.json turbo.json pnpm-*.yaml ./
COPY --chown=node:node apps/api/package.json apps/api/tsconfig.json apps/api/
COPY --chown=node:node packages packages

# installing python for node-gyp
# RUN apk add --update --no-cache python3 build-base gcc && \
# 	ln -sf /usr/bin/python3 /usr/bin/python

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm install --frozen-lockfile && \
	rm -rf /root/.npm /root/.node-gyp /tmp/npm-*

COPY --chown=node:node apps/api/src apps/api/src

RUN pnpm db:generate-types && \
	pnpm build:api && \
	pnpm sourcemaps:api

FROM node:20-alpine as prod

# Don't run production as root
USER node

ENV NODE_ENV=dev

WORKDIR /app

COPY --chown=node:node --from=build /app/node_modules /app/node_modules
COPY --chown=node:node --from=build /app/apps/api/node_modules /app/apps/api/node_modules
COPY --chown=node:node --from=build /app/apps/api/dist /app/apps/api/dist

EXPOSE ${API_PORT}

ENTRYPOINT ["node", "/app/apps/api/dist/main.js"]
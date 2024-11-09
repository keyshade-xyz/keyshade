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

COPY --chown=root:root --chmod=755 package.json turbo.json pnpm-*.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
pnpm install --ignore-scripts --frozen-lockfile && \
rm -rf /root/.npm /root/.node-gyp /tmp/npm-*

COPY --chown=root:root --chmod=755 packages packages
COPY --chown=root:root --chmod=755 apps/api/package.json apps/api/tsconfig.json apps/api/


COPY --chown=root:root --chmod=755 apps/api/src apps/api/src

RUN pnpm db:generate-types && \
	pnpm build:api && \
	pnpm sourcemaps:api

# USER node

FROM node:20-alpine AS prod

# Don't run production as root
USER node

ENV NODE_ENV=production

WORKDIR /app

# COPY --chown=root:root --chmod=755 --from=build /app/node_modules /app/node_modules
COPY --chown=node:node --chmod=755 --from=build /app/apps/api/node_modules /app/apps/api/node_modules
COPY --chown=node:node --chmod=755 --from=build /app/apps/api/dist /app/apps/api/dist

EXPOSE ${API_PORT}

ENTRYPOINT ["node", "/app/apps/api/dist/main.js"]
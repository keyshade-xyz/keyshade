FROM node:22.21-alpine AS build

WORKDIR /app

ENV BUN_HOME="/root/.bun"
ENV PATH="$BUN_HOME/bin:$PATH"

RUN apk add --no-cache bash curl unzip && \
    curl -fsSL https://bun.sh/install | bash

RUN corepack enable

COPY --chown=root:root --chmod=755 package.json turbo.json bun.lock ./
COPY --chown=root:root --chmod=755 apps/api/package.json apps/api/tsconfig.json apps/api/
COPY --chown=root:root --chmod=755 packages packages

RUN --mount=type=cache,id=bun,target=/bun/store \
    bun install --ignore-scripts && \
    rm -rf /root/.npm /root/.node-gyp /tmp/npm-*

COPY --chown=root:root --chmod=755 apps/api/src apps/api/src

RUN bun run db:generate-types && \
	bun run build:api

USER node

FROM node:20-alpine AS prod

RUN apk add --no-cache openssl

# Don't run production as root
USER node

ENV NODE_ENV=dev

WORKDIR /app

COPY --chown=root:root --chmod=755 --from=build /app/node_modules /app/node_modules
COPY --chown=root:root --chmod=755 --from=build /app/apps/api/node_modules /app/apps/api/node_modules
COPY --chown=root:root --chmod=755 --from=build /app/apps/api/dist /app/apps/api/dist

EXPOSE 4200

ENTRYPOINT ["node", "/app/apps/api/dist/main.js"]
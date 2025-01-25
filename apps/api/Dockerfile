FROM node:20.0.0-alpine AS build

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY --chown=root:root --chmod=755 package.json turbo.json pnpm-*.yaml ./
COPY --chown=root:root --chmod=755 apps/api/package.json apps/api/tsconfig.json apps/api/
COPY --chown=root:root --chmod=755 packages packages

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm install --ignore-scripts --frozen-lockfile && \
	rm -rf /root/.npm /root/.node-gyp /tmp/npm-*

COPY --chown=root:root --chmod=755 apps/api/src apps/api/src

RUN pnpm db:generate-types && \
	pnpm build:api

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
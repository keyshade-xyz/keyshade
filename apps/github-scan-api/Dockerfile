FROM node:20.0.0-alpine AS build

WORKDIR /app

RUN corepack enable

COPY --chown=root:root --chmod=755 package.json turbo.json pnpm-*.yaml ./
COPY --chown=root:root --chmod=755 apps/github-scan-api/package.json apps/github-scan-api/tsconfig.json apps/github-scan-api/
COPY --chown=root:root --chmod=755 packages packages

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm install --ignore-scripts --frozen-lockfile && \
	rm -rf /root/.npm /root/.node-gyp /tmp/npm-*

COPY --chown=root:root --chmod=755 apps/github-scan-api/src apps/github-scan-api/src

RUN pnpm build:github-scan-api

USER node

FROM node:20-alpine AS prod

RUN apk add --no-cache git
# Don't run production as root
USER node

WORKDIR /app

COPY --chown=root:root --chmod=755 --from=build /app /app

EXPOSE 8080

RUN mkdir /home/node/keyshade-github-scan

CMD ["node", "apps/github-scan-api/dist/src/index.js"]

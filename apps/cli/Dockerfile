FROM node:20-alpine AS base

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS builder

RUN apk add --no-cache libc6-compat
RUN npm install --ignore-scripts -g turbo

WORKDIR /app

COPY . .

RUN turbo prune @keyshade/cli --docker

FROM base AS installer

RUN apk add --no-cache libc6-compat
RUN npm install --ignore-scripts -g pnpm

WORKDIR /app

COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --no-cache --ignore-scripts

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN pnpm build:cli

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

COPY --from=installer /app/node_modules /app/node_modules
COPY --from=installer /app/apps/cli/node_modules /app/apps/cli/node_modules
COPY --from=installer /app/apps/cli/dist /app/apps/cli/dist
COPY --from=installer /app/apps/cli/package.json /app/apps/cli/package.json

USER node

ENTRYPOINT ["node", "/app/apps/cli/dist/index.cjs"]
CMD ["--help"]

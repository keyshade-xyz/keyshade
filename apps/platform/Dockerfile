FROM node:20-alpine AS base


FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update && apk upgrade
# working directory
WORKDIR /app
RUN npm install --ignore-scripts -g turbo
COPY . .
RUN turbo prune platform --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
RUN apk update
WORKDIR /app




# install the dependencies
RUN npm install --ignore-scripts -g pnpm
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --no-cache --ignore-scripts

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json


RUN pnpm turbo build --filter=platform...

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001  nextjs
USER nextjs

COPY --from=installer /app/apps/platform/next.config.mjs .
COPY --from=installer /app/apps/platform/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer  --chown=nextjs:nodejs /app/apps/platform/.next/standalone ./
COPY --from=installer  --chown=nextjs:nodejs /app/apps/platform/.next/static ./apps/platform/.next/static
COPY --from=installer  --chown=nextjs:nodejs /app/apps/platform/public ./apps/platform/public


ENV PORT=3025
ENV NEXT_SHARP_PATH=/app/apps/platform/.next/sharp
EXPOSE 3025
ENV HOSTNAME "0.0.0.0"


CMD node apps/platform/server.js
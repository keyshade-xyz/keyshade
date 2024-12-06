FROM node:20-alpine AS base


FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update && apk upgrade
# working directory
WORKDIR /app
RUN npm install --ignore-scripts -g turbo
COPY . .
RUN turbo prune web --docker

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

RUN pnpm build:web

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001  nextjs
USER nextjs

COPY --from=installer /app/apps/web/next.config.mjs .
COPY --from=installer /app/apps/web/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer  --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer  --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer  --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public


ENV PORT=3000
ENV NEXT_SHARP_PATH=/app/apps/web/.next/sharp
EXPOSE 3000
# keyshade-ignore
ENV HOSTNAME "0.0.0.0"


CMD node apps/web/server.js
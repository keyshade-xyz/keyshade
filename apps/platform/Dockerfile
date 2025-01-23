FROM node:20-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
RUN apk update && apk upgrade
# working directory
WORKDIR /app
RUN npm install --ignore-scripts -g turbo
COPY . .
RUN turbo prune @keyshade/platform --docker

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
ARG NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ARG NEXT_PUBLIC_SENTRY_PLATFORM_DSN=${NEXT_PUBLIC_SENTRY_PLATFORM_DSN}
ARG NEXT_PUBLIC_SENTRY_PLATFORM_PROFILE_SAMPLE_RATE=${NEXT_PUBLIC_SENTRY_PLATFORM_PROFILE_SAMPLE_RATE}
ARG NEXT_PUBLIC_SENTRY_PLATFORM_TRACES_SAMPLE_RATE=${NEXT_PUBLIC_SENTRY_PLATFORM_TRACES_SAMPLE_RATE}
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT=${NEXT_PUBLIC_SENTRY_ENVIRONMENT}

COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN pnpm build:platform

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001  nextjs
USER nextjs

COPY --from=installer /app/apps/platform/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer  --chown=nextjs:nodejs /app/apps/platform/.next/standalone ./
COPY --from=installer  --chown=nextjs:nodejs /app/apps/platform/.next/static ./apps/platform/.next/static
COPY --from=installer  --chown=nextjs:nodejs /app/apps/platform/public ./apps/platform/public


ENV PORT=3000
ENV NEXT_SHARP_PATH=/app/apps/platform/.next/sharp
EXPOSE 3000
# keyshade-ignore
ENV HOSTNAME "0.0.0.0"

CMD node apps/platform/server.js
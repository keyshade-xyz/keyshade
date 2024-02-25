FROM node:20-alpine AS build

WORKDIR /app

RUN npm i -g pnpm

# COPY package.json .
COPY turbo.json .
COPY pnpm-workspace.yaml .
COPY pnpm-lock.yaml .
COPY package*.json .
COPY ./packages ./packages

COPY apps/web/package.json apps/web/package.json
COPY apps/web/tsconfig.json apps/web/tsconfig.json

RUN pnpm install

COPY . .

RUN pnpm run build:web

EXPOSE 3000

ENTRYPOINT ["pnpm", "run", "start:web"]
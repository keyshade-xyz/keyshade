FROM node:20-alpine AS build

WORKDIR /app

RUN npm i -g pnpm

COPY package.json .
COPY tsconfig.json .

RUN pnpm install

COPY apps/web apps/web

RUN pnpm run build:web

EXPOSE 3000

ENTRYPOINT ["pnpm", "run", "start:web"]
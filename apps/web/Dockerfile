FROM node:20-alpine AS build

WORKDIR /app

RUN npm i -g pnpm

COPY package.json .
COPY turbo.json .

RUN pnpm install

COPY apps/web/package.json apps/web/package.json
COPY apps/web/tsconfig.json apps/web/tsconfig.json

RUN cd apps/web && pnpm install

RUN pnpm install

COPY . .

RUN pnpm run build:web

EXPOSE 3000

ENTRYPOINT ["pnpm", "run", "start:web"]
FROM node:20-alpine as build

WORKDIR /app

RUN npm i -g pnpm

COPY package.json .
COPY tsconfig.base.json .

RUN pnpm install

COPY apps/api apps/api

RUN pnpm run db:generate-types
RUN pnpm run build:api

EXPOSE 4200

ENTRYPOINT ["pnpm", "run", "start:api"]
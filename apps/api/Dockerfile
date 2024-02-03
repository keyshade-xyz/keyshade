FROM node:20-alpine AS build

WORKDIR /app

RUN apk add --no-cache bash
RUN npm i -g pnpm

COPY package.json .
COPY tsconfig.base.json .

RUN pnpm install

COPY apps/api apps/api

COPY apps/api/startup.sh .
RUN chmod +x startup.sh

RUN ls -la

RUN pnpm run db:generate-types
RUN pnpm run build:api

EXPOSE 4200

ENTRYPOINT ["/bin/bash", "startup.sh"]
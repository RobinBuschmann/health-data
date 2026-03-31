FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
RUN npm ci --workspace=packages/api --omit=dev

COPY tsconfig.base.json ./
COPY packages/api/src ./packages/api/src
COPY packages/api/tsconfig.json ./packages/api/

EXPOSE 3000

CMD ["node_modules/.bin/tsx", "packages/api/src/index.ts"]

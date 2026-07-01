FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/analytics-core/package.json packages/analytics-core/package.json
RUN npm ci

COPY tsconfig.json tsconfig.base.json eslint.config.js ./
COPY apps apps
COPY packages packages
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/analytics-core/package.json packages/analytics-core/package.json
RUN npm ci --omit=dev

COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/web/dist apps/web/dist
COPY --from=build /app/packages/contracts/dist packages/contracts/dist
COPY --from=build /app/packages/analytics-core/dist packages/analytics-core/dist

EXPOSE 10000
CMD ["npm", "run", "start", "-w", "@cx/api"]

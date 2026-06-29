# Override when Docker Hub returns 403:
#   docker compose build --build-arg NODE_IMAGE=docker.1ms.run/library/node:20-alpine frontend
ARG NODE_IMAGE=node:20-alpine

FROM ${NODE_IMAGE} AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG API_URL=http://backend:8000

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_URL=$API_URL

COPY package.json package-lock.json ./
COPY . .

RUN npm ci --no-audit --no-fund \
  || (rm -rf node_modules package-lock.json && npm install --no-audit --no-fund)

RUN node scripts/patch-legacy-build.mjs \
  && node ./node_modules/next/dist/bin/next build


# Re-declare ARG so the runner stage uses the same mirror/base image.
ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE} AS runnerWORKDIR /app

RUN apk add --no-cache libc6-compat

ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG API_URL=http://backend:8000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_URL=$API_URL
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]

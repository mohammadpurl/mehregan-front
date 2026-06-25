FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci


FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG API_URL=http://backend:8000

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_URL=$API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Legacy shims + dead files (stale server checkouts) — see scripts/patch-legacy-build.mjs
RUN node scripts/patch-legacy-build.mjs

RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat

ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG API_URL=http://backend:8000

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_URL=$API_URL

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]

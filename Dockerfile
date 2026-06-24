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

# Fix legacy Classbon imports on every image build (server may have old source).
RUN node -e "const fs=require('fs');const w=(p,c)=>{fs.mkdirSync(require('path').dirname(p),{recursive:true});fs.writeFileSync(p,c);console.log('patched',p);};w('app/(auth)/_components/verification-form.tsx',\"'use client';\\nexport { SignInForm as VerificationForm } from './sign-in-form';\\n\");w('lib/classbon-icons.tsx','export { Clock, MessageCircle as Message, Phone, Eye, User, Check, X } from \"lucide-react\";\\n');w('_components/general/button.tsx','export { Button } from \"@/app/components/button\";\\n');w('_components/general/textbox.tsx','export { TextBox } from \"@/app/components/textbox\";\\n');"

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

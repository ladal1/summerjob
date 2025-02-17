# Dockerfile for the main application

# Install dependencies only when needed
FROM node:20-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./
RUN npm ci && npm install -g --arch=x64 --platform=linux --libc=glibc sharp@0.33.4
ENV NEXT_SHARP_PATH=/usr/local/lib/node_modules/sharp

# Rebuild the source code only when needed
FROM node:20-slim AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN apt-get update -y && apt-get install -y openssl

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN npx prisma generate

RUN npm run build

# Production image, copy all the files and run next
FROM node:20-slim AS runner
WORKDIR /app
COPY --from=deps --chown=nextjs:nodejs /usr/local/lib/node_modules/sharp /usr/local/lib/node_modules/sharp

# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN apt-get update -y && apt-get install -y openssl

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/build/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/build/static ./build/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
RUN mkdir /web-storage && chmod 777 /web-storage

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]

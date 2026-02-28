# Dockerfile for the main application

# Install dependencies only when needed
FROM node:22-slim AS deps
# Use slim (glibc) to match the builder and runner stages, ensuring compatible native binaries (e.g., sharp).
RUN apt-get update -y && apt-get install -y --no-install-recommends libc6-compat openssl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./
# Copy prisma schema for the prepare script
COPY prisma ./prisma
RUN npm ci

# Rebuild the source code only when needed
FROM node:22-slim AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && \
	apt-get clean && rm -rf /var/lib/apt/lists/* && \
	npx prisma generate && \
	npm run build

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# Production image, copy all the files and run next
FROM node:22-slim AS runner
WORKDIR /app

# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    apt-get update -y && apt-get install -y --no-install-recommends openssl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/build/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/build/static ./build/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Copy sharp and its native binaries so Next.js image optimisation works at runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@img ./node_modules/@img
RUN mkdir /web-storage && chmod 777 /web-storage

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
ARG NODE_VERSION=24.13.0-alpine

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:${NODE_VERSION} AS dependencies

WORKDIR /app

# Prisma requires OpenSSL and some native modules still expect glibc compatibility
RUN apk add --no-cache openssl libc6-compat

# Copy package files first to maximize layer cache hit rate
COPY package.json package-lock.json .npmrc* ./
COPY prisma ./prisma

# Install dependencies
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# ============================================
# Stage 2: Build Next.js app (standalone output)
# ============================================
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# Prisma requires OpenSSL and some native modules still expect glibc compatibility
RUN apk add --no-cache openssl libc6-compat

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production

# Next.js telemetry can be disabled if needed:
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ============================================
# Stage 3: Runtime
# ============================================
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Prisma runtime requires OpenSSL and some native modules still expect glibc compatibility
RUN apk add --no-cache openssl libc6-compat

COPY --from=builder --chown=node:node /app/public ./public

# Set correct permissions for build cache/prerender paths and external storage path
RUN mkdir -p build /web-storage && chown node:node build && chmod 777 /web-storage

# output file tracing + standalone server
COPY --from=builder --chown=node:node /app/build/standalone ./
COPY --from=builder --chown=node:node /app/build/static ./build/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]
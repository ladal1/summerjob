ARG NODE_VERSION=24.13.0-slim
ARG SHARP_VERSION=0.33.5

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:${NODE_VERSION} AS dependencies

WORKDIR /app

# Prisma requires OpenSSL in slim images
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && \
        apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy package files first to maximize layer cache hit rate
COPY package.json package-lock.json .npmrc* ./
COPY prisma ./prisma

# Install dependencies
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund --include=optional --cpu=wasm32

# ============================================
# Stage 2: Build Next.js app (standalone output)
# ============================================
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# Prisma requires OpenSSL in slim images
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && \
        apt-get clean && rm -rf /var/lib/apt/lists/*

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

# Prisma runtime requires OpenSSL in slim images
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && \
        apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /app/public ./public

# Set correct permissions for build cache/prerender paths
RUN mkdir -p build && chown node:node build

# output file tracing + standalone server
COPY --from=builder --chown=node:node /app/build/standalone ./
COPY --from=builder --chown=node:node /app/build/static ./build/static

RUN mkdir /web-storage && chmod 777 /web-storage

USER node

EXPOSE 3000

CMD ["node", "server.js"]
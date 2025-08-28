# Multi-stage Dockerfile for building and running the Next.js app
#
# Stages:
# 1) base: common setup for all stages
# 2) deps: install all dependencies for building
# 3) build: compile the Next.js app
# 4) prod-deps: install production-only deps for smaller runtime image
# 5) runner: minimal runtime image serving the built app

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (for build)
FROM base AS deps
# Copy lockfiles first to maximize layer caching
COPY package.json package-lock.json ./
# Install exact versions from lockfile
RUN npm ci

# Build the application
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build Next.js app (uses Turbopack per package.json)
ENV NODE_ENV=production
RUN npm run build

# Install only production dependencies for runtime
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create data dir for app JSON storage and mark it as a writable volume
# Your app writes to `process.cwd()/data` (see src/lib/db.ts)
RUN mkdir -p /app/data
VOLUME ["/app/data"]

# Copy production node_modules and built assets
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts

# The app listens on 3000 when using `next start`
EXPOSE 3000

# Run the production server
CMD ["npm", "start"]


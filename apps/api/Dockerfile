FROM node:22-alpine AS builder

# Enable corepack for pnpm
RUN corepack enable

WORKDIR /app

# Copy root files needed for pnpm install
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies (frozen lockfile to ensure deterministic build)
RUN pnpm install --frozen-lockfile

# Build the shared package and the api
RUN pnpm --filter @mailer/shared build
RUN pnpm --filter @mailer/database build
RUN pnpm --filter api build

# Deploy isolated api app and its dependencies to /app/out
RUN pnpm --filter api --prod --legacy deploy /app/out

FROM node:22-alpine AS runner
WORKDIR /app

# Non-root user for security (OpenShift / K8s friendly)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodejs

COPY --from=builder /app/out ./

# OpenShift runs containers with an arbitrary UID in root group (GID 0)
RUN chown -R 1001:0 /app && \
    chmod -R g=u /app

USER 1001

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]

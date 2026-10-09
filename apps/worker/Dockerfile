FROM node:22-alpine AS builder

RUN corepack enable
WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @mailer/shared build
RUN pnpm --filter @mailer/database build
RUN pnpm --filter worker build

RUN pnpm --filter worker --prod --legacy deploy /app/out

FROM node:22-alpine AS runner
WORKDIR /app

# Non-root user (OpenShift / K8s friendly)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodejs

COPY --from=builder /app/out ./

# OpenShift runs containers with an arbitrary UID in root group (GID 0)
RUN chown -R 1001:0 /app && \
    chmod -R g=u /app

USER 1001

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]

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

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

COPY --from=builder --chown=nodejs:nodejs /app/out ./

USER nodejs

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]

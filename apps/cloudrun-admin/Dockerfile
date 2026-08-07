FROM oven/bun:1.3.14-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY patches patches
COPY apps apps
COPY packages packages
RUN bun install --production --frozen-lockfile --ignore-scripts

FROM oven/bun:1.3.14-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/cloudrun-admin/node_modules ./apps/cloudrun-admin/node_modules
COPY packages ./packages
COPY apps/cloudrun-admin/package.json apps/cloudrun-admin/package.json
COPY apps/cloudrun-admin/src ./apps/cloudrun-admin/src
WORKDIR /app/apps/cloudrun-admin
USER bun
EXPOSE 8080
CMD ["bun", "run", "src/index.ts"]

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
COPY --from=deps /app/apps/cloudrun-usage/node_modules ./apps/cloudrun-usage/node_modules
COPY packages ./packages
COPY apps/cloudrun-usage/package.json apps/cloudrun-usage/package.json
COPY apps/cloudrun-usage/src ./apps/cloudrun-usage/src
WORKDIR /app/apps/cloudrun-usage
USER bun
EXPOSE 8080
CMD ["bun", "run", "src/index.ts"]

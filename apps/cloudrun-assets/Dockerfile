FROM oven/bun:1.3.14-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY patches patches
COPY apps apps
COPY packages packages
RUN bun install --production --frozen-lockfile --ignore-scripts \
    && mkdir -p node_modules/@tokens \
    && for pkg in packages/*/; do \
         name=$(basename "$pkg"); \
         ln -sf "../../packages/$name" "node_modules/@tokens/$name"; \
       done

FROM oven/bun:1.3.14-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/cloudrun-assets/node_modules ./apps/cloudrun-assets/node_modules
COPY packages ./packages
COPY apps/cloudrun-assets/package.json apps/cloudrun-assets/package.json
COPY apps/cloudrun-assets/src ./apps/cloudrun-assets/src
WORKDIR /app/apps/cloudrun-assets
USER bun
EXPOSE 8080
CMD ["bun", "run", "src/index.ts"]

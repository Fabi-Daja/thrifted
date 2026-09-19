# Stage 1 — build (SSR, nitro preset "node-server", shih vite.config.ts)
FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# VITE_* futen ne bundle-in e klientit ne kohen e build-it, jo runtime-in
ARG VITE_API_URL=http://127.0.0.1:8000
ENV VITE_API_URL=$VITE_API_URL

RUN bun run build

# Stage 2 — runtime (vetem output i ndertuar + node, pa bun/devDependencies)
FROM node:20-slim AS runtime

WORKDIR /app

RUN useradd --create-home appuser
COPY --from=build --chown=appuser:appuser /app/.output ./.output
USER appuser

ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]

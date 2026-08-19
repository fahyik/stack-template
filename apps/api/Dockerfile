# syntax=docker/dockerfile:1.7

# Debian (glibc) rather than Alpine (musl): several common native deps —
# sharp, canvas, Playwright — either don't ship musl prebuilds or aren't
# officially supported on it. Switch to alpine if you're sure you need none
# of them; the image is ~80MB smaller.
FROM node:24.19.0-bookworm-slim AS base
WORKDIR /app

# Stage 1: Prune the monorepo to a self-contained subset for @repo/api.
FROM base AS pruner
RUN npm install -g turbo@2.10.11
COPY . .
RUN turbo prune @repo/api --docker

# Stage 2: Install all deps, build, then strip devDependencies.
FROM base AS builder
COPY --from=pruner /app/out/json/ ./
RUN npm ci --prefer-offline --no-audit --fund=false
COPY --from=pruner /app/out/full/ ./
RUN npx turbo run build --filter=@repo/api
# Remove devDependencies from the workspace tree in place. Workspace symlinks
# (e.g. node_modules/@repo/logger -> packages/logger) and built dist/
# directories are preserved.
RUN npm prune --omit=dev

# Stage 3: Runner — minimal production image.
FROM base AS runner
ENV NODE_ENV=production

RUN groupadd --system --gid 1001 expressjs \
 && useradd --system --uid 1001 --gid expressjs --shell /usr/sbin/nologin --home-dir /home/expressjs --create-home expressjs \
 && mkdir -p /app/logs \
 && chown -R expressjs:expressjs /app /home/expressjs

COPY --from=builder --chown=expressjs:expressjs /app/ ./

USER expressjs

CMD ["npm", "run", "start", "-w", "apps/api"]

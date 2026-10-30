# syntax=docker/dockerfile:1
# Targets: deps -> dev | build -> prod.   docker build --target prod -t mortgage-calculator .

ARG NODE_VERSION=22

# ---- deps: full install (dev + prod) via Yarn 4 from corepack ----
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
# husky's postinstall fails without .git; skip it in images.
ENV HUSKY=0 YARN_ENABLE_TELEMETRY=0
# packageManager in package.json pins Yarn 4.18.1; corepack fetches it.
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
RUN --mount=type=cache,target=/root/.yarn/berry/cache \
    yarn install --immutable

# ---- dev: source is bind-mounted by docker-compose ----
FROM deps AS dev
ENV NODE_ENV=development
EXPOSE 5173
CMD ["yarn", "dev"]

# ---- build: compile the static bundle ----
FROM deps AS build
# Vite inlines VITE_* at BUILD time, so they must be build args, not runtime env.
# They end up in the public bundle: never pass secrets.
ARG VITE_API_BASE_URL
ARG VITE_APP_NAME
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_APP_NAME=${VITE_APP_NAME}
# .dockerignore keeps node_modules, dist, .env*, .git out of the context.
COPY . .
RUN yarn build

# ---- prod-deps: production dependencies only (react, serve, ...) ----
FROM node:${NODE_VERSION}-alpine AS prod-deps
WORKDIR /app
ENV HUSKY=0 YARN_ENABLE_TELEMETRY=0
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
# The root postinstall runs `husky`, a devDependency that focus --production omits (exit 127),
# so drop that script from this stage's copy of package.json only.
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));delete p.scripts.postinstall;fs.writeFileSync('package.json',JSON.stringify(p))"
RUN --mount=type=cache,target=/root/.yarn/berry/cache \
    yarn workspaces focus --all --production

# ---- prod: minimal runtime, non-root, no build tooling ----
FROM node:${NODE_VERSION}-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/" >/dev/null || exit 1
# Shell form so ${PORT} expands; exec keeps serve as PID 1 for signals.
CMD ["sh", "-c", "exec node_modules/.bin/serve -s dist -l ${PORT}"]

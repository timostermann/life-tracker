FROM node:24-alpine AS deps
WORKDIR /app
ENV HUSKY=0
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
# python3/make/g++ are required to compile better-sqlite3's native binding.
# SvelteKit's build-time postbuild analysis imports hooks.server.ts, which calls
# getDb() eagerly, so the binding must already be compiled here (no --ignore-scripts).
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
ENV HUSKY=0
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx svelte-kit sync && npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0
ENV DATABASE_PATH=/data/db.sqlite
ENV HUSKY=0
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
# Non-root user matching the UID/GID the VPS data volume is chowned to (see DEPLOYMENT.md).
RUN apk add --no-cache python3 make g++ \
	&& addgroup --system --gid 1001 nodejs \
	&& adduser --system --uid 1001 sveltekit \
	&& mkdir -p /data \
	&& chown -R sveltekit:nodejs /data
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
	&& npm rebuild better-sqlite3 \
	&& apk del python3 make g++ \
	&& rm -rf /root/.npm
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build

USER sveltekit

EXPOSE 3000
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "require('http').get('http://127.0.0.1:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "build"]

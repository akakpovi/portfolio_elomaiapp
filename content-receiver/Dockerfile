# Content receiver: authenticated WordPress -> static blog publisher.
# Runs as the unprivileged `node` user; only /data is writable.
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.mjs ./
COPY lib ./lib
COPY assets ./assets

RUN mkdir -p /data/public /data/versions \
    && chown -R node:node /data /app

ENV NODE_ENV=production \
    PORT=8080 \
    DATA_DIR=/data

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1

CMD ["node", "server.mjs"]

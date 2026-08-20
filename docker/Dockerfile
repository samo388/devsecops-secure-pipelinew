FROM node:22-alpine AS dependencies

WORKDIR /app

COPY app/package*.json ./

RUN npm ci --omit=dev


FROM node:22-alpine AS runtime

WORKDIR /app

RUN apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx

COPY --from=dependencies /app/node_modules ./node_modules
COPY app/package.json ./package.json
COPY app/server.js ./server.js

USER node

EXPOSE 3000

CMD ["node", "server.js"]
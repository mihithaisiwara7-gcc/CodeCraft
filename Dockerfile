FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY public ./public
COPY server.js ./server.js

ENV NODE_ENV=production

CMD ["node", "server.js"]

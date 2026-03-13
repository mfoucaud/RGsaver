FROM node:20-alpine

WORKDIR /app

# Dépendances d'abord (cache Docker)
COPY package*.json ./
RUN npm ci --omit=dev

# Code source
COPY server.js ./
COPY public/ ./public/

# Répertoire pour la base SQLite (monté en volume)
RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/data/rgsaver.db

EXPOSE 3000

CMD ["node", "server.js"]

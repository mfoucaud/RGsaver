# Stage 1 : build (node:20 Debian, python3/make/g++ déjà inclus — pas d'apk)
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2 : image finale légère
FROM node:20-alpine

WORKDIR /app

# Copie uniquement les node_modules compilés depuis le builder
COPY --from=builder /app/node_modules ./node_modules

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

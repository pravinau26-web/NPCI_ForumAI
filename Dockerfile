# Stage 1: Build Application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production Execution
FROM node:20-alpine AS runner

WORKDIR /app

RUN mkdir -p /data /app/storage /app/storage/s3_assets && chmod -R 777 /data /app/storage

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

VOLUME ["/data"]

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV DATA_VOLUME_PATH=/data

CMD ["node", "dist/server.cjs"]

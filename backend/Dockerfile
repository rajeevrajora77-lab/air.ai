FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY scripts ./scripts
COPY src/database/migrations ./src/database/migrations

EXPOSE 5000

CMD ["sh", "-c", "npm run migrate && node dist/server.js"]
# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm install

COPY . .

EXPOSE 5173

CMD ["sh", "-c", "npm install && npm run build && npm run start"]

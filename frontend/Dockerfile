FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install Chromium and required system libs for Playwright E2E in container.
RUN npx playwright install --with-deps chromium

COPY . .

EXPOSE 5173

CMD ["sh", "-c", "npm install && npm run build && npm run start"]

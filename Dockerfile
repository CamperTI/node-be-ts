# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM --platform=linux/amd64 node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production ────────────────────────────────────────────────────────
FROM --platform=linux/amd64 node:22-slim AS production

# Install Google Chrome Stable from Google's repo — handles all its own deps
RUN apt-get update && apt-get install -yq --no-install-recommends \
    gnupg wget ca-certificates \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub \
       | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
       > /etc/apt/sources.list.d/google.list \
    && apt-get update && apt-get install -yq --no-install-recommends \
       google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Use system Chrome instead of Puppeteer's bundled Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

# Non-root user for security
RUN useradd -m -u 1001 nodeuser \
    && chown -R nodeuser:nodeuser /app

USER nodeuser

EXPOSE 3000

CMD ["node", "dist/server.js"]

FROM node:22-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  wget \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# 👇 IMPORTANT: force puppeteer cache
ENV PUPPETEER_CACHE_DIR=/usr/local/share/puppeteer

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev) and Chrome
RUN npm ci \
  && npx puppeteer browsers install chrome

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Create non-root user for security
RUN useradd -m -u 1001 nodeuser \
  && chown -R nodeuser:nodeuser /app

USER nodeuser

# Expose port (Render uses PORT env var, which defaults to 10000)
EXPOSE 10000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]

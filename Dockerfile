FROM ghcr.io/puppeteer/puppeteer:latest

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH "/usr/bin/google-chrome-stable"

WORKDIR /user/src/app

COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 10000
RUN npm run build
# Multi-stage build für optimale Image-Größe
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiere package files
COPY package*.json ./

# Installiere ALLE dependencies (inkl. devDependencies für den Build)
RUN npm ci && \
    npm cache clean --force

# Kopiere source code
COPY . .

# Build der Anwendung
RUN npm run build

# Production stage
FROM nginx:alpine

# Installiere curl für healthcheck
RUN apk add --no-cache curl

# Kopiere built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Kopiere nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

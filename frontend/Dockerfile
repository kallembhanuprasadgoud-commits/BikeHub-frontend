# ==========================================
# Stage 1: Build React SPA bundle
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Cache package dependencies
COPY package*.json ./
RUN npm ci

# Copy sources and compile bundle with Vite
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Nginx Web Server & Reverse Proxy
# ==========================================
FROM nginx:alpine

# Copy compiled SPA assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

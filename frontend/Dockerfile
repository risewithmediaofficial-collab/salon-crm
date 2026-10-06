# ============================================================
#  SALON CRM — FRONTEND PRODUCTION DOCKERFILE
#  Multi-stage build: Vite compilation + Nginx web server
#  Build from project root: docker build -f frontend/Dockerfile -t salon-crm-frontend .
# ============================================================

# Stage 1: Build the React + Vite frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy frontend package manifests first for Docker layer caching
COPY frontend/package*.json ./frontend/

WORKDIR /app/frontend
RUN npm ci

# Copy shared utilities and frontend source code
WORKDIR /app
COPY shared ./shared
COPY frontend ./frontend

WORKDIR /app/frontend

# Build arguments for Vite (embedded into client bundle at build-time)
ARG VITE_API_BASE_URL=/api
ARG VITE_SALON_NAME="Luxe Salon CRM"
ARG VITE_SALON_PHONE="+91 98765 43210"
ARG VITE_SALON_ADDRESS="104 Elegance Avenue, Bengaluru"
ARG VITE_CURRENCY_SYMBOL="₹"

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SALON_NAME=$VITE_SALON_NAME
ENV VITE_SALON_PHONE=$VITE_SALON_PHONE
ENV VITE_SALON_ADDRESS=$VITE_SALON_ADDRESS
ENV VITE_CURRENCY_SYMBOL=$VITE_CURRENCY_SYMBOL

# Build static assets
RUN npm run build

# Stage 2: Serve production assets with Nginx
FROM nginx:alpine

# Configure default backend proxy target environment variables
ENV BACKEND_HOST=backend
ENV BACKEND_PORT=5000

# Copy nginx template for automated envsubst substitution on container start
COPY frontend/nginx.conf /etc/nginx/templates/default.conf.template

# Copy built frontend assets
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Expose internal HTTP port (mapped to host port 95 via Docker Compose)
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

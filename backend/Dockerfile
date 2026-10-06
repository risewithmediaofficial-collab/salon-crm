# ============================================================
#  SALON CRM — BACKEND PRODUCTION DOCKERFILE
#  Build from project root: docker build -f backend/Dockerfile -t salon-crm-backend .
# ============================================================

FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Install native compilation dependencies for packages like argon2
RUN apk add --no-cache python3 make g++

# Copy backend package manifests first for optimal Docker layer caching
COPY backend/package*.json ./backend/

# Install only production dependencies
WORKDIR /app/backend
RUN npm ci --omit=dev

# Copy shared modules and backend source files
WORKDIR /app
COPY shared ./shared
COPY backend ./backend

WORKDIR /app/backend

# Create logs directory
RUN mkdir -p logs

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose internal backend port (mapped via Docker Compose to host port 5012)
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start production server
CMD ["node", "src/server.js"]

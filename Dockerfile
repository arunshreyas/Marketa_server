FROM node:20-bullseye-slim

# Set work directory
WORKDIR /app

# Install dependencies only (use lockfile if present)
COPY package.json package-lock.json* ./
RUN set -eux; \
    if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi

# Copy app source
COPY . .

# Environment
ENV NODE_ENV=production \
    PORT=4000 \
    PY_AI_SERVICE_URL=http://py_ai_service:8000

# Use non-root user for security
USER node

# Expose runtime port (configurable via PORT env)
EXPOSE 4000

# Start the server
CMD ["npm", "start"]

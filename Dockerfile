# Railway Dockerfile - Noche de Cartas
FROM node:22-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p /app/data

# Set production environment
ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/db.sqlite
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start script: push schema then start server
CMD ["sh", "-c", "npx drizzle-kit push && NODE_ENV=production node dist/boot.js"]

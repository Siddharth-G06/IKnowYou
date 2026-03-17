FROM node:20-alpine

WORKDIR /app

# Install dependencies separately for better caching
COPY package.json package-lock.json* ./
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Default command for development (overridden in docker-compose.yml)
CMD ["npm", "run", "dev"]

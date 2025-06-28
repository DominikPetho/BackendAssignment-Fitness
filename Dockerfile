FROM node:12.22.12-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies using package-lock.json for consistency
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Default command
CMD ["npm", "start"] 
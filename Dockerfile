FROM node:12.14-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies using package-lock.json for consistency
RUN npm i

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Default command
CMD ["npm", "start"] 
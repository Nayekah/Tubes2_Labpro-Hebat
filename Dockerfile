# Dockerfile

# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and lock file
COPY src/frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY src/frontend .

# Expose Next.js port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "dev"]

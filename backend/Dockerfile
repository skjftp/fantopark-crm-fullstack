# Use the official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Expose the port
EXPOSE 8080

# Set the PORT environment variable for Cloud Run
ENV PORT=8080

# Start the application
CMD ["node", "src/server.js"]

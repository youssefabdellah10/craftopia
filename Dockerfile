FROM node:20-alpine

WORKDIR /usr/local/app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --silent

# Copy source code
COPY . .

# Set environment variable for API URL
ENV VITE_API_BASE_URL=https://craftopia-backend-youssefabdellah10-dev.apps.rm3.7wse.p1.openshiftapps.com

# Build the application with increased memory limit
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Clean up node_modules to reduce image size
RUN rm -rf node_modules && npm ci --silent --only=production

# Set permissions
RUN chmod -R 755 /usr/local/app

EXPOSE 8080

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]
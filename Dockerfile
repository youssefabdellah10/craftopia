FROM node:20-alpine

WORKDIR /usr/local/app

COPY package.json package-lock.json ./

RUN npm ci --silent

COPY . .

# Set environment variable for API URL
ENV VITE_API_BASE_URL=https://craftopia-backend-youssefabdellah10-dev.apps.rm3.7wse.p1.openshiftapps.com

# Build the application with the environment variable
RUN npm run build

RUN chmod -R 777 /usr/local/app

EXPOSE 8080

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]
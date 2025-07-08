FROM node:20-alpine

WORKDIR /usr/local/app

COPY package.json package-lock.json ./

RUN npm ci --silent

COPY . .

RUN chmod -R 777 /usr/local/app

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
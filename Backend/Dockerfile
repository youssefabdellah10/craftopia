FROM node:18

WORKDIR /app

ENV NODE_ENV=production
ENV FIREBASE_DATABASE_URL=https://craftopia-b79f8-default-rtdb.europe-west1.firebasedatabase.app/

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
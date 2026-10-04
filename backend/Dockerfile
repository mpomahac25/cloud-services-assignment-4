FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY server.js ./
COPY VERSION ./

EXPOSE 3000

CMD ["npm", "start"]
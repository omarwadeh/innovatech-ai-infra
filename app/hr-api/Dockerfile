FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --production || npm install --production --legacy-peer-deps

COPY server.js .

EXPOSE 3000
CMD ["node", "server.js"]

FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --only-production || npm install

# ⬇️ HIER DE FIX: kopieer ALLE bestanden van hr-api
COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]

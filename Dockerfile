FROM node:20

WORKDIR /app

ADD package*.json /app

RUN npm ci

COPY . /app/

RUN npm run build

CMD node build/index.js
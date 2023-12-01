FROM node:20
WORKDIR /app
ADD package*.json /app
RUN npm ci
ADD build /app/
CMD node index.js
FROM node:current-buster

ENV TZ="America/Phoenix"

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

EXPOSE 8080
CMD [ "node", "server.js" ]

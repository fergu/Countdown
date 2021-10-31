FROM node:current-buster

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

EXPOSE 8080
ENTRYPOINT [ "npm" ]
CMD [ "start" ]

ARG NODE_VERSION=lts-alpine

FROM node:${NODE_VERSION}

ARG APP_HOME=/app

WORKDIR ${APP_HOME}

COPY package*.json ./

RUN npm install

COPY . ${APP_HOME}

CMD [ "npm", "start" ]

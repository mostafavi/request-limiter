FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4000

ENV HOST=0.0.0.0
ENV PORT=4000
# LOW: 100 MEDIUM: 500 HIGH: 1000  request per hour
ENV LOAD=LOW

CMD [ "node", "index.js" ]
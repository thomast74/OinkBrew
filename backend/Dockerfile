FROM node:16-alpine
LABEL maintainer="Thomas Trageser <thomast74@gmail.com>"

# set EST timezone and time
ENV TZ=Europe/Berlin
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create the working dir
RUN mkdir -p /opt/app
WORKDIR /opt/app

COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000

CMD ["npm", "run", "start"]

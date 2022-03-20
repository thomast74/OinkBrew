FROM mongo:5.0

ENV TZ=Europe/Berlin
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

COPY mongod.conf /etc/mongod.conf

CMD ["mongod",  "-f", "/etc/mongod.conf"]

echo "Init docker cluster"
sleep 10
mongosh --host mongo1:27021 --username $ROOT_USERNAME --password $ROOT_PASSWORD --authenticationDatabase admin --eval 'config = { "_id" : "oinkbrewReplSet", "members" : [
      {
          "_id" : 0,
          "host" : "mongo1:27021",
          "priority": 1
        },
        {
          "_id": 1,
          "host" : "mongo2:27022",
          "priority": 2
        },
        {
          "_id": 2,
          "host": "mongo3:27023",
          "priority": 3
        }
      ] };  rs.initiate(config);'
echo "Init docker cluster finished"

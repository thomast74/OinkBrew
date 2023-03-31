echo "Init docker cluster"
sleep 20
mongosh --host mongo1-e2e:27026 --username $ROOT_USERNAME --password $ROOT_PASSWORD --authenticationDatabase admin --eval 'config = { "_id" : "oinkbrewReplSet", "members" : [
      {
          "_id" : 0,
          "host" : "mongo1-e2e:27026",
          "priority": 1
        },
        {
          "_id": 1,
          "host" : "mongo2-e2e:27027",
          "priority": 2
        },
        {
          "_id": 2,
          "host": "mongo3-e2e:27028",
          "priority": 3
        }
      ] };  rs.initiate(config);'
echo "Init docker cluster finished"

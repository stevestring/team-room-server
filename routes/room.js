var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var bodyParser = require('body-parser');
var db = require("../db");

AWS.config.update({
    region: db.DynamoConfig.region,
    endpoint: db.DynamoConfig.endpoint
});


//One room
router.get('/:id',lookupRoom, function(req, res, next) {
    res.json(req.room);
});

//All rooms
router.get('/',lookupRooms, function(req, res, next) {
    res.json(req.rooms);
});

//Update Room
router.put('/:id',putRoom, function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json(req.room);

    
    
});



function lookupRoom(req, res, next) {
    // We access the ID param on the request object
    var roomId = parseInt( req.params.id,10);

    var AWS = require("aws-sdk");

    var docClient = new AWS.DynamoDB.DocumentClient()

    var params = {
        TableName: "Room",
        Key:{
            "RoomId": roomId
        }
    };

    console.log(params);

    docClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
        }

        // By attaching a Photo property to the request
        // Its data is now made available in our handler function
        req.room = data.Item;
        next();
    });

}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }


function putRoom(req, res, next) {
    // We access the ID param on the request object
    var roomId = parseInt( req.params.id,10);

    var AWS = require("aws-sdk");

    var docClient = new AWS.DynamoDB.DocumentClient()


    var table = "Room";

    var roomName = req.body.name; 
    var activty = req.body.activity; 
    var activitystate = req.body.activitystate; 
    var message = req.body.message; 
    var messageid = req.body.messageid; 


    console.log(req.body);
    console.log(req.body.card);
    var params = {
        TableName:table,
        Item:{
            "RoomId": roomId,
            "Name": roomName,
            "Activity": activty,
            "ActivityState":activitystate,
            "MessageId":messageid,
            "Message":message,
            "ttl":addDays(Date.now(),1),
            "Datemodified":Date.now()
        }

    };

    console.log("Add/Update Room...");
    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));
            try{
                console.log("Emitting room update...");
                res.io.emit("room-" + roomId,"room updated");
                console.log("Emitted room update...");
            }
            catch (err) {
                console.log(err);
            }
        }

        req.room = data;
        next();
    });

}


///TODO: use this instead of coding in data insert
function emitRoomUpdate()
{
    try{
        console.log("Emitting room update...");
        res.io.emit("room","hello");
        console.log("Emitted room update...");
    }
    catch (err) {
        console.log(err);
    }
}

function lookupRooms(req, res, next) {
    // We access the ID param on the request object
    var playerId = req.params.id;

    var docClient = new AWS.DynamoDB.DocumentClient()

    var params = {
        TableName: "Room"
    };


    docClient.scan(params, onScan);

    function onScan(err, data) {
        if (err) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            // print all the movies
            console.log("Scan succeeded.");
            console.log("Added item:", JSON.stringify(data, null, 2));

            req.rooms = data;
            next();

            // continue scanning if we have more movies, because
            // scan can retrieve a maximum of 1MB of data
            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);


            }
        }
    }

}


module.exports = router;

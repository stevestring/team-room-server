var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var bodyParser = require('body-parser');
var db = require("../db");

AWS.config.update({
    region: db.DynamoConfig.region,
    endpoint: db.DynamoConfig.endpoint
});


router.get('/:rid/:iid',lookupRoomInput, function(req, res, next) {
    res.json(req.roomInput);
});
router.put('/:rid/:iid',putRoomInput, function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json(req.roomInput);
});

function lookupRoomInput(req, res, next) {
    // We access the ID param on the request object
    var roomInputId =  req.params.iid;
    var roomId = parseInt( req.params.rid,10);

    var AWS = require("aws-sdk");

    var docClient = new AWS.DynamoDB.DocumentClient()

    var params = {
        TableName: "RoomInput",
        Key:{
            "RoomId": roomId,
            "RoomInputId": roomInputId
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
        req.roomInput = data.Item;
        next();
    });

}

function putRoomInput(req, res, next) {
    // We access the ID param on the request object
    
    var roomId = parseInt( req.params.rid,10);
    var roomInputId =  req.params.iid;

    console.log(req.params.rid+":"+req.params.iid);

    var AWS = require("aws-sdk");

    var docClient = new AWS.DynamoDB.DocumentClient()


    var table = "RoomInput";

    var input = req.body.Input; //This needs to be flexible to accomodate multiple activities and inputs
    console.log(req.body);
    console.log(req.body.Input);
    var params = {
        TableName:table,
        Item:{
            "RoomId": roomId,
            "RoomInputId": roomInputId,
            "Input": input,
            "Datemodified":Date.now()
        }

    };

    console.log("Adding a new item...");
    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));

            if (err) {
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("Added item:", JSON.stringify(data, null, 2));
                try{
                    console.log("Emitting room update...");
                    res.io.emit("room-input-" + roomId,"room updated");
                    console.log("Emitted room update...");
                }
                catch (err) {
                    console.log(err);
                }
            }


        }

        req.roomInput = data;
        next();
    });

}

module.exports = router;

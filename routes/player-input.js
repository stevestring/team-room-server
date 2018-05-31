var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var bodyParser = require('body-parser');
var db = require("../db");

AWS.config.update({
    region: db.DynamoConfig.region,
    endpoint: db.DynamoConfig.endpoint
});

// Set no cache headers to ensure browsers (especially IE) don't cache the API requests
router.use((req, res, next) => {
    res.setHeader('Expires', '-1');
    res.setHeader('Cache-Control', 'no-cache');
    next();
});

router.get('/:rid/:pid',lookupPlayerInput, function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json(req.playerInput);
});
router.put('/:rid/:pid',putPlayerInput, function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json(req.playerInput);
});

function lookupPlayerInput(req, res, next) {
    // We access the ID param on the request object
    var playerId = parseInt( req.params.pid,10);
    var roomId = parseInt( req.params.rid,10);

    var AWS = require("aws-sdk");

    var docClient = new AWS.DynamoDB.DocumentClient()

    var params = {
        TableName: "PlayerInput",
        Key:{
            "RoomId": roomId,
            "PlayerId": playerId
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
        req.playerInput = data.Item;
        next();
    });


}

function putPlayerInput(req, res, next) {
    // We access the ID param on the request object
    var playerId = parseInt( req.params.pid,10);
    var roomId = parseInt( req.params.rid,10);

    var AWS = require("aws-sdk");

    var docClient = new AWS.DynamoDB.DocumentClient()


    var table = "PlayerInput";

    var card = req.body.Card; //This needs to be flexible to accomadate multiple activities and inputs
    console.log(req.body);
    console.log(req.body.card);
    var params = {
        TableName:table,
        Item:{
            "RoomId": roomId,
            "PlayerId": playerId,
            "Card": card,
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
                    console.log("Emitting player update...");
                    res.io.emit("player-input-" + roomId,"player updated");
                    console.log("Emitted player update...");
                }
                catch (err) {
                    console.log(err);
                }
            }


        }

        req.playerInput = data;
        next();
    });

}

module.exports = router;

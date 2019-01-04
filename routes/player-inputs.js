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

router.get('/:id',lookupRoomPlayerInputs, function(req, res, next) {
    res.json(req.roomPlayerInputs);
});

router.delete('/:id',deleteRoomPlayerInputs, function(req, res, next) {
    res.json(req.roomPlayerInputs);
});


function getPlayerInputs(roomId, callback) {

    console.log("roomid: "+ roomId);
    var docClient = new AWS.DynamoDB.DocumentClient()

    var params = {
        TableName: "PlayerInput",
        KeyConditionExpression: "RoomId = :r",
        ProjectionExpression: "RoomId,Card, PlayerInput, #p",        
        ExpressionAttributeNames: {
            "#p": "PlayerId",
        },
        ExpressionAttributeValues: {
            ":r":roomId
        }

    };

    console.log(params);

    docClient.query(params, onScan);

    function onScan(err, data) {
        if (err) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            // print all the movies
            console.log("Scan succeeded.");
            console.log("Added item:", JSON.stringify(data, null, 2));

            return callback(data);

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


function lookupRoomPlayerInputs(req, res, next) {
    var roomId = parseInt( req.params.id,10);
    
    getPlayerInputs(roomId,function(data){        
        var roomPlayerInputs =data; 
        console.log(roomPlayerInputs);        
        req.roomPlayerInputs = roomPlayerInputs;
        next();
    })

}


function deleteRoomPlayerInputs(req, res, next) {
    var roomId = parseInt( req.params.id,10);

    getPlayerInputs(roomId,function(data){        
    var currentRoomPlayerInputs =data.Items; 
    var documentclient = new AWS.DynamoDB.DocumentClient();

    var itemsArray = [];

    console.log("currentRoomPlayerInputs:" + JSON.stringify(currentRoomPlayerInputs));

    currentRoomPlayerInputs.forEach(function(item) {
        console.log(item);        
        console.log("room:" +item.RoomId + " Player:" + item.PlayerId);
    
        itemsArray.push(
            {
                DeleteRequest : {
                    Key : {
                        'RoomId' : parseInt( item.RoomId,10),
                        'PlayerId' : parseInt( item.PlayerId,10)
                    }
                }
            });
    });
    
    if (itemsArray.length===0)
    {
        console.log("Nothing to delete");
    }
    else
    {
        console.log("delete items:" + itemsArray);

        var params = {
            RequestItems : {
                'PlayerInput' : itemsArray
            }
        };
        documentclient.batchWrite(params, function(err, data) {
            if (err) {
                console.log('Batch delete unsuccessful ...');
                console.log(err, err.stack); // an error occurred
                req.roomPlayerInputs = data;
                next();
            } else {
                console.log('Batch delete successful ...');
                console.log(data); // successful response           
                console.log("next");
            }
        });
    }
    req.roomPlayerInputs = null;
    next();
    
    });
}



module.exports = router;

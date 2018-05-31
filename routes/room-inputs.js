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

router.get('/:id',lookupRoomInputs, function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json(req.roomInputs);
});

router.delete('/:id',deleteRoomInputs, function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.json(req.roomInputs);
});


function getRoomInputs(roomId, callback) {

    console.log("roomid: "+ roomId);
    var docClient = new AWS.DynamoDB.DocumentClient()

    var params = {
        TableName: "RoomInput",
        KeyConditionExpression: "RoomId = :r",
        ProjectionExpression: "RoomId,#i,RoomInputId",        
        ExpressionAttributeNames: {
            "#i": "Input",
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


function lookupRoomInputs(req, res, next) {
    var roomId = parseInt( req.params.id,10);
    
    getRoomInputs(roomId,function(data){        
        var roomInputs =data; 
        console.log(roomInputs);        
        req.roomInputs = roomInputs;
        next();
    })

}


function deleteRoomInputs(req, res, next) {
    var roomId = parseInt( req.params.id,10);

    getRoomInputs(roomId,function(data){        
    var currentRoomInputs =data.Items; 
    var documentclient = new AWS.DynamoDB.DocumentClient();

    var itemsArray = [];

    //console.log("currentRoomPlayerInputs:" + JSON.stringify(currentRoomInputs));

    currentRoomInputs.forEach(function(item) {
        //console.log(item);        
        console.log("room:" +item.RoomId + " InputId:" + item.RoomInputId);
    
        itemsArray.push(
            {
                DeleteRequest : {
                    Key : {
                        'RoomId' : parseInt( item.RoomId,10),
                        'RoomInputId' : item.RoomInputId
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
                'RoomInput' : itemsArray
            }
        };
        documentclient.batchWrite(params, function(err, data) {
            if (err) {
                console.log('Batch delete unsuccessful ...');
                console.log(err, err.stack); // an error occurred
                req.roomInputs = data;
                next();
            } else {
                console.log('Batch delete successful ...');
                console.log(data); // successful response           
                console.log("next");
            }
        });
    }
    req.roomInputs = null;
    next();
    
    });
}



module.exports = router;

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var playerInputsRouter = require('./routes/player-input');
var roomPlayerInputsRouter = require('./routes/player-inputs');
var roomRouter = require('./routes/room');

var socket_io    = require( "socket.io" );


var app = express();


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Socket.io
var io           = socket_io();
app.io           = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/player-input', playerInputsRouter);
app.use('/room', roomRouter);
app.use('/player-inputs', roomPlayerInputsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// socket.io events
io.on('connection', (client) => {

  client.on('subscribeToRoomChanges', (room) => {
    console.log('client is subscribing to room changes ', room);

  });

  client.on('subscribeToPlayerInputChanges', (room) => {
    console.log('client is subscribing to player input changes ', room);

  });

});


const port = 8000;
io.listen(port);
console.log('listening on port ', port);

module.exports = app;

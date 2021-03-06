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
var roomInputRouter = require('./routes/room-input');
var roomInputsRouter = require('./routes/room-inputs');

var app = express();

// var server = require('http').Server(app, { origins: '*:*'});
var server = require('http').Server(app);
var allowedOrigins = "*:*";
var io = require('socket.io')(server, {origins: allowedOrigins});

// ADD THIS
var cors = require('cors');
app.use(cors());


app.use(function(req, res, next){
  res.io = io;
  next();
});



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
app.use('/users', usersRouter);
app.use('/player-inputs', roomPlayerInputsRouter);
app.use('/room-input', roomInputRouter);
app.use('/room-inputs', roomInputsRouter);


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


module.exports = {app: app, server: server};
//setup
var _       = require('underscore'),
    express = require('express'),
    server  = express(),
    http    = require('http').Server(server),
    io      = require('socket.io')(http),
    fs      = require('fs'),
    config  = require('./config/config.json'),
    twitch  = require('./modules/twitch.js');

var ascii = fs.readFileSync('./includes/ascii-art.txt').toString();

console.log(ascii);

server.use(express.static(__dirname + '/public'));

server.get('/', function(req, res) {

  res.render('index');

})
  
io.on('connection', function(socket){

  console.log('a client connected');

  twitch.setup(function(res) {

    socket.emit(res.type, res.data);

  })

  socket.on('chat_message', function(data) {

    var err = twitch.sendMessage(data);

    if (!_.isNull(err)) {

      console.log(err);
      return false;

    }

    data.user = {
      username: config.username
    }

    socket.emit('chat', data);

  })

  socket.on('disconnect', function(socket){

    console.log('a client disconnected');

  })

})

// setup a twitch stats callback
twitch.stats_callback = function(res) {

  io.sockets.emit('stats', res);

}

http.listen(2843, function(){

  console.log('listening on *:2843');

})
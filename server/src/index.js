var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');


var app = express();
var httpServer = require('http').Server(app);
var io = require('socket.io')(httpServer);

var port = process.env.port || 50005;

app.set('port', port);

// replace this with either nginx static file serving or sth
app.use('/', express.static(path.join(__dirname, '../../client/src')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// attach api
require('./api')(app);

var ps = require('./progress_server');

/* Setup socket.io for giving live upates on progress of the download
 * */
var sockets = [];
io.on('connection', function (socket) {
  console.log(">> a user connected");
  sockets.push(socket);

  socket.on('download', function (data) {
    var trackId = data.trackId;
    console.log("progress listener added to: " + trackId);
    ps.add(trackId, socket);
  });

  socket.on('end', function () {
    console.log("<< a user disconnected");
    var index = sockets.indexOf(socket);
    sockets.splice(index--, 1);
  });
});

httpServer.listen(port, function () {
  console.log('teenysong api server listening on *: localhost:' + port);
  console.log('(nginx upstream proxy_passed from api.teenysong.com)');
});

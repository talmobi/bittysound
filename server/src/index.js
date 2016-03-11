var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');

var extend = require('extend');

var app = express();
var httpServer = require('http').Server(app);
var io = require('socket.io')(httpServer);

var port = process.env.port || 3050;

app.set('port', port);

// replace this with either nginx static file serving or sth
app.use('/', express.static(path.join(__dirname, '../../client/src')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// init database
var Store = require('jfs');
var db = new Store("data", {type: 'single'});

var __counter = 1;
function genSimpleId () {
  return Date.now() + "-" + __counter++;
};

var StatMessage = function (data) {
  var obj = extend({}, data);
  obj._id = genSimpleId();
  obj.created_at = Date.now();

  // save self
  obj.save = function (done) {
    db.save(obj, function (err, id) {
      done(err, obj);
    });
  };

  return obj;
};

// attach api
require('./api')(app);

var ps = require('./progress_server');

/* Setup socket.io for giving live upates on progress of the download
 * */
if (db) {
  console.log("connected to databse");

  // configure sockets
  var sockets = [];
  io.on('connection', function (socket) {
    var xff = socket.handshake.headers['x-forwarded-for'];
    var handshake = socket.handshake.address;
    var address = xff || handshake;

    //console.log(socket);

    console.log("x-forwarded-for: " + xff);
    console.log("handshake: " + handshake);

    //console.log(socket.client.Client.conn);
    //socket.client.Client.conn.socket.remoteAddress = xff;
    //socket.remoteAddress = xff;

    console.log(">> a user connected ["+address+"]");
    sockets.push(socket);

    // send hello message
    socket.emit('hello', "hello, this is teenysong, welcome! :D");

    socket.on('download', function (data) {
      var trackId = data.trackId;
      ps.add(trackId, socket);

      var Stat = new StatMessage({
        trackId: data.trackId,
        type: "download",
        emitter: "download"
      });
      Stat.save(function (err, doc) {
        if (err) {
          return console.log("error saving to database");
        }
        console.log("saved stat message: " + Stat.type);
      });
    });

    socket.on('stats', function (data) {
      data.emitter = "stats";
      var Stat = new StatMessage(data);
      Stat.save(function (err, doc) {
        if (err) {
          return console.log("error saving to database");
        }
        console.log("saved stat message: " + Stat.type);
      });
    });

    socket.on('end', function () {
      console.log("<< a user disconnected");
      var index = sockets.indexOf(socket);
      sockets.splice(index--, 1);
    });
  });


  // start http express server
  httpServer.listen(port, function () {
    console.log('teenysong api server listening on *: localhost:' + port);
    console.log('(nginx upstream proxy_passed from api.teenysong.com)');
  });
} else {
  console.log("db connection error: " + err.message || err);
}

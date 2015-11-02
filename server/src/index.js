var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');

var auth = require('./auth.json');
var mongoose = require('mongoose');

var app = express();
var httpServer = require('http').Server(app);
var io = require('socket.io')(httpServer);

var port = process.env.port || 50005;

app.set('port', port);

// replace this with either nginx static file serving or sth
app.use('/', express.static(path.join(__dirname, '../../client/src')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// init database
var db_url = auth.mongolab.url
  .replace('<dbuser>', auth.mongolab.dbuser)
  .replace('<dbpassword>', auth.mongolab.dbpassword);
var db = mongoose.connect(db_url).connection;
var Schema = mongoose.Schema;
var StatMessage = mongoose.model('StatMessage', mongoose.Schema({
  _id: { type: Schema.ObjectId, auto: true },
  emitter: String,
  trackId: String,
  type: String,
  title: String,
  message: String,
  created_at: { type: Date, default: Date.now }
}));

// attach api
require('./api')(app);

var ps = require('./progress_server');

/* Setup socket.io for giving live upates on progress of the download
 * */
db.on('error', function (err) {
  console.log("db connection error: " + err.message || err);
});

db.once('open', function () {
  console.log("connected to databse");


  // configure sockets
  var sockets = [];
  io.on('connection', function (socket) {
    console.log(">> a user connected");
    sockets.push(socket);

    socket.on('download', function (data) {
      var trackId = data.trackId;
      console.log("progress listener added to: " + trackId);
      ps.add(trackId, socket);

      var Stat = new StatMessage({
        trackId: data.trackId,
        type: "download",
        emitter: "download"
      });
      Stat.save(function (err, doc) {
        if (err) {
          console.log("error saving to database");
        }
      });
    });

    socket.on('stats', function (data) {
      data.emitter = "stats";
      var Stat = new StatMessage(data);
      Stat.save(function (err, doc) {
        if (err) {
          console.log("error saving to database");
        }
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
});

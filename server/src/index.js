var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var httpServer = require('http').Server(app);

var port = process.env.port || 50005;

app.set('port', port);

// replace this with either nginx static file serving or sth
app.use('/', express.static(path.join(__dirname, '../../client/src')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// attach api
require('./api')(app);

httpServer.listen(port, function () {
  console.log('teenysong api server listening on *: localhost:' + port);
  console.log('(nginx upstream proxy_passed from api.teenysong.com)');
});

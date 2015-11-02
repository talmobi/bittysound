var tracks = {};
var MAX_UPDATES_PER_SECOND_PER_TRACK = 1;
var delay = 1000 / MAX_UPDATES_PER_SECOND_PER_TRACK;

// adds a user socket to listen for progress updates on a given track
function add (trackId, socket) {
  if (!tracks[trackId]) {
    tracks[trackId] = [];
  }
  tracks[trackId].push(socket);
};

// used by server while downloading track from sound cloud
// to update the status of the download to the user
function update (trackId, percent) {
  percent = percent | 0;
  if (percent <= 1) {
    return;
  }
  //console.log("updating:" + trackId);
  var sockets = tracks[trackId];
  var now = Date.now();

  // limit the updates
  var lastTime = sockets.lastTime;
  var lastPercent = sockets.lastPercent;
  if (lastPercent !== percent && (!lastTime || now > lastTime + delay)) {
    sockets.lastTime = now;
    sockets.lastPercent = percent;
    //console.log("percent: " + percent);

    // update users listening for progress updates
    if (sockets) {
      for (var i = 0; i < sockets.length; i++) {
        var socket = sockets[i];
        socket.emit('progress', {
          trackId: trackId,
          percent: percent
        });
      };
    }
  } 
};

// used by server when a track has completed downloading
function clear (trackId) {
  var sockets = tracks[trackId];
  if (sockets) {
    for (var i = 0; i < sockets.length; i++) {
      var socket = sockets[i];
      socket.emit('completed', {
        trackId: trackId
      });
    };
  }
  tracks[trackId] = null; // clear the listening sockets
};

module.exports = {
  add: add,
  update: update,
  clear: clear
};

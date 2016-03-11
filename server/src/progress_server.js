var tracks = {};
var MAX_UPDATES_PER_SECOND_PER_TRACK = 10;
var delay = 1000 / MAX_UPDATES_PER_SECOND_PER_TRACK;

// adds a user socket to listen for progress updates on a given track
function add (trackId, socket) {
  console.log("progress listener ADDED to: " + trackId);
  tracks[trackId] = tracks[trackId] || [];
  tracks[trackId].push(socket);
};

// used by server while downloading track from sound cloud
// to update the status of the download to the user
function update (trackId, percent) {
  percent = Math.floor(percent);
  //console.log("ps update: %s, %s", trackId, percent);

  if (percent <= 1) {
    console.log("percent is below 1");
    return;
  }
  //console.log("updating:" + trackId);
  var sockets = tracks[trackId];
  var now = Date.now();

  if (!sockets) {
    console.log("sockets are falsy");
    return;
  }

  // limit the updates
  var lastTime = sockets.lastTime || 1000;
  var lastPercent = sockets.lastPercent || null;
  if (lastPercent != percent && (now > (lastTime + delay))) {
    sockets.lastTime = now;
    sockets.lastPercent = percent;
    //console.log("percent: " + percent);

    // update users listening for progress updates
    if (sockets) {
      for (var i = 0; i < sockets.length; i++) {
        console.log("ps sending progress: " + percent);
        var socket = sockets[i];
        socket.emit('progress', {
          trackId: trackId,
          percent: percent
        });
      };
    }
  } else {
    //console.log("ps failed to send progress: " + percent);
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

SC.initialize({
  client_id: "711c21de667ecd3ea4e91721e5a4fae1"
});


var lastSound = null;
var $lastSpan = null;
var trackIsPlaying = false;

function play(track, $listElement) {
  SC.stream(track.uri || track, function (sound) {
    var $s = $listElement.find('span');


    if (lastSound) {
      lastSound.stop();
    }

    if ($lastSpan) {
      $lastSpan.removeClass("pause-icon");
    }

    if ($s.is($lastSpan)) { // same track
      if (trackIsPlaying) {
        lastSound.stop();
        $s.removeClass("pause-icon");
        trackIsPlaying = false;
      } else {
        // TODO fix pause/resume
        lastSound.play();
        trackIsPlaying = true;
        $s.addClass("pause-icon");
      }
    } else { // new track
      if ($s) {
        sound.play();
        trackIsPlaying = true;
        $s.addClass("pause-icon");
      }

      lastSound = sound;
    }

    $lastSpan = $s;

  });
}

var list = $('#list');

var lastTracks = null;
var currentTrackIndex = 0;

function addTrackInfo(amount) {
  if (!lastTracks)
    return;

  var tracks = lastTracks;

  console.log("current: " + currentTrackIndex);
  console.log("tracks.length: " + tracks.length);

  if (currentTrackIndex >= tracks.length) {
    showMessage("<b>Didn't find any more songs!</b> Try a new search?", "error");

    $('#more-button').removeClass().html("No more songs found!");

    return;
  }

  var limit = amount + currentTrackIndex;
  for (var i = currentTrackIndex; i < limit; i++) {
    var t = tracks[i];

    var t_title = t.title.substring(0, 48);
    if (t.title.length > 48) {
      t_title += "...";
    }

    var el = $(
      '<li class="list-item fadeIn animated" onclick="click">' +
        '<span class="play-icon title">' + t_title + '</span>' +
      '</li>'
    );

    el.on('click', function () {
      console.log("click: " + this.trackUri);
      play(this.track, this);
    }.bind(el))

    el.trackUri = t.uri;
    el.track = t;
    list.append(el);
  }
  currentTrackIndex = limit;
}

var defaultLimit = 12;
var $text = $('#message-text');

function search(str) {
  // set spinning icon to signify loading
  $text.removeClass().html('').addClass('icon-spin3 animate-spin');

  var query = {
    q: str,
    limit: defaultLimit
  }

  SC.get("http://api.soundcloud.com/tracks", query, function (tracks) {
    showMessage("<b>Here are some results.</b>", "ok");

    currentTrackIndex = 0;
    lastTracks = tracks;
    $('#more-button').html("More results").removeClass().addClass('icon-plus');
    var track = tracks[0];
    if (tracks.length < 1) {
      console.log("No tracks found!");
    } else {
      console.log(tracks[0]);
      //play(track);

      // clear list
      list.empty();

      addTrackInfo(4);
    }
  }); // SC.get
}

search("melody circus");

var input = $('.searchbar input');
var timeout = null;
input.on('input', function () {
  if (timeout) {
    clearTimeout(timeout);
  }
  timeout = setTimeout(function() {
    search(input.val());
  }, 400);
})

// seupt more button
$('#more-button').on('click', function() {
  addTrackInfo(2);
});

var $text = $('#message-text');
var $message = $('.message');
function showMessage(message, type) {
  console.log("showmessage called");
  $text.removeClass();
  $text.html(message);

  $message.removeClass();
  $message.addClass("message info-ok info-" + type);
}

console.log("app loaded");
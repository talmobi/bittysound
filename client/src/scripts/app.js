SC.initialize({
  client_id: "711c21de667ecd3ea4e91721e5a4fae1"
});

var lastSound = null;
var $lastSpan = null;
var trackIsPlaying = false;

var LOAD_TIMEOUT = 2000; // ms
var loadStartedTime = null;

function play(track, $listElement) {
  var $s = $listElement.find('i');
  if (!$s.is($lastSpan)) { // not same track
    $s.addClass("icon-spin3 animate-spin");
    $s.spinning = true;
  }

  // bind event to remove the loading icon once music is playing
  var opts = (function(){
    var e = $s;
    return {
      whileplaying: function () {
        if (!e.spinning)
          return;

        if (this.position < 1) // once actually playing
          return;
        console.log("Music started to play.");
        e.removeClass("icon-spin3 animate-spin");
        e.spinning = false;
      }
    };
  })();

  SC.stream(track.uri || track, opts, function (sound) {

    if (lastSound) {
      lastSound.stop();
    }

    if ($lastSpan) {
      $lastSpan.removeClass("icon-pause");
      $lastSpan.removeClass("icon-spin3 animate-spin");
    }

    if ($s.is($lastSpan)) { // same track

      // pause/resume check
      if (trackIsPlaying) {
        var pp = lastSound.position;
        console.log("paused at " + pp);
        lastSound._pausePosition = pp;
        lastSound.pause();
        $s.removeClass("icon-pause");
        trackIsPlaying = false;
      } else {
        var pp = lastSound._pausePosition || 0;
        console.log("resumed at: " + pp);
        lastSound.setPosition(pp);
        lastSound.play();
        trackIsPlaying = true;
        $s.addClass("icon-pause");
      }

    } else { // selected new track
      if ($s) {
        sound.play();
        trackIsPlaying = true;
        $s.addClass("icon-pause");
      }

      lastSound = sound;
    }

    $lastSpan = $s;

  });
}

var $list = $('#list');

var lastTracks = null;
var currentTrackIndex = 0;

function addMoreTracks(amount) {
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
      '<li class="$list-item fadeIn animated">' +
        '<i class="icon-play"></i><span class="title">' + t_title + '</span>' +
      '</li>'
    );

    var ii = el.find('i');
    (function(){
      var e = el;
      ii.on('click', function () {
        console.log("click: " + e.trackUri);
        play(e.track, e);
        return false;
      })
    }());

    el.trackUri = t.uri;
    el.track = t;
    $list.append(el);
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
    currentTrackIndex = 0;
    lastTracks = tracks;
    $('#more-button').html("More results").removeClass().addClass('icon-plus');
    var track = tracks[0];
    if (tracks.length < 1) {
      console.log("No tracks found!");
      $list.empty();
      $('.results-footer').css("display", "none");
      showMessage("<b>Didn't find any songs!</b> Try a new search?", "error");
    } else {
      showMessage("<b>Here are some results.</b>", "ok");

      // clear list
      $list.empty();

      addMoreTracks(4);
      $('.results-footer').css("display", "block");
    }
  }); // SC.get
}

// default debug search result
search("melody circus");

var defaultText = "Search for any song";
var input = $('.searchbar input');

// setup input watermark
input.val(defaultText);
input.on('focus', function () {
  input.val("");
});
input.on('blur', function () {
  if (input.val().length < 1)
    input.val(defaultText);
});

var timeout = null;
input.on('input', function () {

  if (timeout) {
    clearTimeout(timeout);
  }

  if (input.val().length <= 0)
    return; // do nothing


  timeout = setTimeout(function() {
    if (input.val().length < 2) {
      showMessage("<b>How about</b> we try searching for something real?", 'ok');
      return;
    }
    search(input.val());
  }, 400);
})

// seupt more button
$('#more-button').on('click', function() {
  addMoreTracks(2);
  return false;
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

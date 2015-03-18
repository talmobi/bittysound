SC.initialize({
  client_id: "711c21de667ecd3ea4e91721e5a4fae1"
});

var debug = true;
var lastSound = null;
var lastTrack = null;
var $lastIcon = null;
var trackIsPlaying = false;

function log(str) {
  if (debug)
    console.log(str);
}

var LOAD_TIMEOUT = 2200; // ms
var loadStartedTime = null;

function play(track, $listElement) {
  if (lastTrack !== track) {
    if (lastSound) {
      lastSound.stop();
      if (lastSound._timeout) {
        clearTimeout(lastSound._timeout);
      }
    }

    if ($lastIcon) {
      $lastIcon.removeClass("icon-pause icon-spin3 animate-spin");
    }
  } else { // attempting to play same track
    if ($lastIcon.hasClass("icon-block")
        || !lastSound._pausePosition || lastSound._pausePosition < 1) {
      log("Same track but broken track");

      if ($lastIcon.hasClass('icon-spin3')) {
        lastSound.stop();
        $lastIcon.removeClass("icon-pause icon-spin3 animate-spin icon-block");
        if (lastSound._timeout) {
          clearTimeout(lastSound._timeout);
        }
        return;
      }
    } else {
      log("Same track");
      $lastIcon.addClass("icon-spin3 animate-spin");
      $lastIcon.spinning = true;

      var cont = false;
      if (lastSound) {
        if (lastSound._timeout) {
          clearTimeout(lastSound._timeout);
        }
        if (lastSound.playState) { // if currently playing
          var pp = lastSound.position;
          log("paused at " + pp);
          lastSound._pausePosition = pp;
          lastSound.stop();
          $lastIcon.removeClass('icon-pause icon-spin3 animate-spin');
        } else { // not current playing
          var pp = lastSound._pausePosition || 0;
          lastSound.setPosition(pp);
          lastSound.play();
          log("resumed at " + pp);
          $lastIcon.addClass('icon-pause icon-spin3 animate-spin');
          $lastIcon.spinning = true;
        }
        return;
      }
    }
  }

  var $i = $listElement.find('i');
  $i.removeClass("icon-block");
  $i.addClass("icon-spin3 animate-spin");
  $i.spinning = true;

  // bind events to remove the loading icon once music is playing
  // and icon for sop when fnished playing
  var opts = (function(){
    var e = $i;
    return {
      whileplaying: function () {
        if (!e.spinning)
          return;
        if (this.position < 1) // once actually playing
          return;
        log("Music started to play.");
        e.removeClass("icon-spin3 animate-spin");
        e.spinning = false;
        if (this._timeout)
          clearTimeout(this._timeout);
      },
      onfinish: function () {
        log(" >>> ONFINISH CALLED");
        e.removeClass("icon-pause");
      }
    };
  })();

  var uri = track.uri || track;
  SC.stream(uri, opts, function (sound) {
    window.ss = sound;

    //soundManager.stopAll();
    sound.play();
    $i.addClass("icon-pause");

    // retry playing sound if first attempt fails
    (function(){
      var mySound = sound;
      var $e = $i;
      log("setting up retry check timeout");
      mySound._timeout = setTimeout(function() {
        log("retry check timeout called");

        if (mySound.playState && mySound.position < 1) {
          // if still not playing - try again
          mySound.setPosition(0);
          mySound.play();
          log(" -- retrying to play track");

          // set another timeout that tells the user
          // the music is broken if it still doesn't work
          mySound._timeout = setTimeout(function(){
            log('  final check called');
            if (mySound.playState && mySound.position < 1) {
              $e
                .removeClass("icon-spin3 animate-spin icon-paused")
                .addClass("icon-block");
              var str = "Oh noes :( that track seems to be <b>broken.</b>";
              //showMessage(str, 'error');
              showNotice(str, 'error');
              mySound.stop();
              log(" !! track seems to be broken, tell user and stop trying");
            } else {
              log("    playState: " + mySound.playState);
              log("    position: " + mySound.position);
            }
          }, LOAD_TIMEOUT * 1 + 500); // extend
        } else {
          log("element OK but check failed");
          log("  position is: " + mySound.position);
        }
      }, LOAD_TIMEOUT);
    })();

    lastSound = sound;
  }); // eof SC.stream

  $lastIcon = $i;
  lastTrack = track;
}

var $list = $('#list');

var lastTracks = null;
var currentTrackIndex = 0;

function addMoreTracks(amount, animation) {
  if (!lastTracks)
    return;

  var tracks = lastTracks;

  log("current: " + currentTrackIndex);
  log("tracks.length: " + tracks.length);

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

    var ani = animation || 'fadeIn';
    var $el = $(
      '<li class="$list-item ' + ani + ' animated">' +
        '<i class="icon-play"></i><span class="title">' + t_title + '</span>' +
      '</li>'
    );

    var ii = $el.find('i');
    ii.track = t;
    (function(){
      var e = $el;
      ii.on('click', function () {
        log("click: " + e.track.uri);
        play(e.track, e);
        return false;
      })
    }());

    $el.track = t;
    $list.append($el);
  }
  currentTrackIndex = limit;
}

var defaultLimit = 16;
var $text = $('#message-text');

function search(str) {
  // set spinning icon to signify loading
  showMessage(null, 'ok');
  showNotice(null); // clear the notice
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
      log("No tracks found!");
      $list.empty();
      $('.results-footer').css("display", "none"); // hide more button
      showMessage("<b>Didn't find any songs!</b> Try a new search?", "error");
    } else {
      showMessage("<b>Here are some results.</b>", "ok");

      // clear list for new search
      $list.empty();

      // Initial amount of tracks to show after search
      addMoreTracks(4);
      $('.results-footer').css("display", "block"); // show more button
    }
  }); // eof SC.get
}

var inputWatermarkText = "Search for any song";
var input = $('.searchbar input');

// setup input watermark
var first = true;
input.val(inputWatermarkText);
input.on('focus', function () {
  input.val("");
});
input.on('blur', function () {
  if (input.val().length < 1)
    input.val(inputWatermarkText);
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
var $message = $('#message-box');
function showMessage(message, type) {
  log("showMessage called");
  $text.removeClass();
  if (message)
    $text.html(message);

  $message.removeClass();
  $message.addClass("message info-ok info-" + type);
}

var $nText = $('#notice-text');
var $nMessage = $('#notice-box');
var nTimeout = null;
// show temporary notice message
function showNotice (message, type) {
  log("showNotice called");

  $nText.removeClass();
  if (message) {
    $nText.html(message);
  } else {
    if (nTimeout) {
      clearTimeout(nTimeout);
    }
    $nMessage.addClass('fadeOut animated');
    return false;
  }

  $nMessage.removeClass();
  $nMessage.addClass("message bounce animated info-ok info-" + type);

  $nMessage.css('display', 'block');

  if (nTimeout)
    clearTimeout(nTimeout);

  nTimeout = setTimeout(function(){
    //$nMessage.css('display', 'none');
    $nMessage.addClass('fadeOut animated');
  }, LOAD_TIMEOUT * 1.8);
}

log("app loaded");
// default debug search result
search("melody circus");


document.body.addEventListener('touchstart', function () {
  log("in touchstart evt");
  document.body.removeEventListener('touchstart', arguments.callee);
}, false);

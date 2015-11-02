$(function() {
  SC.initialize({
    client_id: "711c21de667ecd3ea4e91721e5a4fae1"
  });

  var host = window.location.protocol + "//" + window.location.host;

  var ENV = 'dev';

  if (window.location.host.indexOf('local') == -1) {
    ENV = 'production';
  };

  var selected_track_url = null;
  var selected_track_id = null;

  /* Setup socket.io to listen for live progress on a download
   * */
  var socket = null;
  if (ENV == 'dev') {
    socket = io();
  } else {
    socket = io("d.teenysong.com:50005");
  }

  var debug = true;
  var lastSound = null;
  var lastTrack = null;
  var $lastIcon = null;
  var trackIsPlaying = false;

  var lastSearch = "";

  var history = window.localStorage.getItem('history') || [];
  window.history = history;

  // some test history
  history.push( 336736 );
  history.push( 6902662 );

  // triggered on track list change (like after a search)
  var onSearchLoad = null;


  /*
   * setup modal
   * */
  var elModal = document.getElementById('modal');
  var elCancelButton = document.getElementById('cancel-button');
  var elDownloadButton = document.getElementById('download-button');
  var elHrefDownload = document.getElementById('href-download');
  var elSongName = document.getElementById('song-name');

  var elProgress = document.getElementById('download-progress');
  var elProgressBar = document.getElementById('download-progress-bar');

  var pressDelay = 4000;
  elHrefDownload.pressTime = Date.now();
  elHrefDownload.onclick = function (e) {
    console.log("Download Link Clicked!");

    var now = Date.now();
    if (now > elHrefDownload.pressTime + pressDelay) {
      elHrefDownload.pressTime = now;
      console.log("triggering download");
      setProgress(1);
      // trigger download
      // socket.io listen for live progress updates on the track download
      socket.emit('download', {
        trackId: selected_track_id
      });
    } else {
      // dont trigger the download
      console.log("download already in progress, please wait");
      e.preventDefault();
      return false;
    }
  };

  elCancelButton.onclick = function () {
    console.log("cancel-button clicked");
    hideModal();
  };
  function showModal() {
    elModal.style.display = 'block';
  };
  function hideModal() {
    elModal.style.display = 'none';
    setProgress(0);
  };
  function setModalInfo (name, url) {
    elSongName.innerHTML = name; // modal song name
    elHrefDownload.href = url; // download button link
  };

  function setProgress (percent) {
    elProgress.style.display = percent <= 0 ? "none" : "block";
    elProgressBar.style.width = percent + "%";
  };

  /* Setup socket.io to listen for live progress on a download
   * */
  socket.on('progress', function (data) {
    var trackId = data.trackId;
    var percent = data.percent;
    setProgress(percent);
  });
  socket.on('completed', function (data) {
    setProgress(100);
    // close the download modal after completion
    setTimeout(function () {
      // close the modal
      hideModal();
      setProgress(0);
    }, 1000);
  });

  /*
   * logging
   * */
  function log(str) {
    if (debug)
      console.log(str);
  }

  String.prototype.replaceAll = function (find, replace) {
    return this.replace(new RegExp(find, 'g'), replace);
  }

  var LOAD_TIMEOUT = 4500; // ms
  var loadStartedTime = null;

  function play(track, $listElement) {
    if (lastTrack !== track) {
      if (lastSound) {
        lastSound.stop();
        soundManager.stopAll();
        if (lastSound._timeout) {
          clearTimeout(lastSound._timeout);
        }
      }

      if ($lastIcon) {
        $lastIcon.removeClass("icon-pause icon-spin3 animate-spin");
      }
    } else { // attempting to play same track
      if ($lastIcon.hasClass("icon-block")) {
        if (lastSound) {
          if (lastSound._timeout) {
            clearTimeout(lastSound._timeout);
          }
          if (lastSound.playState) {
            $lastIcon.removeClass("icon-spin3 animate-spin");
            lastSound.stop();
            return;
          } else {
            // do nothing, continue with trying to play the track
          }
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

    if (track) {
      socket.emit('stats', {
        type: "play",
        trackId: track.id,
        title: track.title
      });
    };

    // add spinning icon and remove it once music
    // starts plaing
    var $i = $listElement ? $($listElement.find('button')[0]) : null;
    if ($i) {
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
            e.removeClass("icon-spin3 animate-spin icon-block");
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
    }

    var uri = track.uri || track;
    SC.stream(uri, opts, function (sound) {
      window.ss = sound;

      if (soundManager)
        soundManager.stopAll();
      sound.play();

      if ($i) {
        $i.addClass("icon-pause");
        // save to history
        history.push(track.id);
        console.log("track id added to history: " + track.id);
      }

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
                if ($e) {
                  $e
                    .removeClass("icon-spin3 animate-spin icon-paused")
                    .addClass("icon-block");
                }
                var str = "Oh noes :( that track seems to be <b>broken.</b>";
                //showMessage(str, 'error');
                showNotice(str, 'error');
                //mySound.stop();
                soundManager.stopAll();
                log(" !! track seems to be broken, tell user and stop trying");
              } else {
                log("    playState: " + mySound.playState);
                log("    position: " + mySound.position);
              }
            }, LOAD_TIMEOUT * 1.2 + 500); // extend
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

  window.play = play;

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

    var limit = (amount + currentTrackIndex);
    for (var i = currentTrackIndex; i < limit; i++) {
      var t = tracks[i];
      if (!t) continue;

      var _l = 40;
      var t_title = t.title.substring(0, _l);
      var shortTitle = t_title;
      if (t.title.length > _l) {
        t_title += "...";
      }

      var _track_id = t.uri.substring(t.uri.lastIndexOf('/')).substring(1);
      var track_url = host + '/track/' + _track_id;

      // add query param 'title' for custom default name
      track_url += "?title=" + shortTitle;

      var ani = animation || 'fadeIn';
      // create list item (track)
      var $el = $(
        '<li class="list-item ' + ani + ' animated">' +
          '<button id="track'+i+'" class="icon-play"></button>' +
          '<span class="title">' +
            t_title +
          '</span>' +
          '<div class="right">' +
            '<button class="icon-export"></button>' +
            //'<form style="display: inline;" method="get" action="'+ track_url +'">' + 
            //'<a href="' + track_url + '">' +
              '<button type="submit" class="icon-download"></button>' +
            //'</a>' +
            //'</form>' +
          '</div>' +
        '</li>'
      );

      var buttons = $el.find('button');
      // play/pause button
      var ii = $(buttons[0]);
      ii.trackNumber = i;
      ii.track = t;
      (function(){
        var e = $el;
        ii.on('click', function () {
          log("click: " + e.track.uri);
          play(e.track, e);
          return false;
        })
      }());

      // export/copypaste link
      var ii_export = $(buttons[1]);
      ii_export.trackNumber = i + 1;
      ii_export.track = t;
      ii_export.trackId = _track_id;
      (function(){
        var e = $el;
        var self = ii_export;
        ii_export.on('click', function () {
          log("click: " + e.track.uri);
          log(e.track);

          //showNotice(host + '/?search='+ lastSearch +'&track=' + self.trackId, 'info');
          showNotice(host + '/?search='+ lastSearch.replaceAll(' ', '+') +'&play=' + self.trackNumber, 'info');

          return false;
        })
      }());

      // download link
      var ii_download = $(buttons[2]);
      ii_download.trackNumber = i;
      ii_download.track = t;
      (function(){
        var e = $el;
        var turl = track_url;
        var tid = _track_id;
        var st = shortTitle;
        ii_download.on('click', function () {
          log("download click: " + e.track.uri);
          log(e.track);
          //window.location.href = "http://" + track_url;
          selected_track_url = turl;
          selected_track_id = tid;

          // setup modal info
          setModalInfo(st, turl);

          // show the modal
          showModal();

          return false;
        })
      }());

      $el.track = t;
      $list.append($el);
    }
    currentTrackIndex = limit;

    if (typeof onSearchLoad === 'function') {
      onSearchLoad();
    };
  }

  var defaultLimit = 16;
  var $text = $('#message-text');

  function playTrack(id) {
    var uri = "/tracks/" + id;

    if (lastTrack && (typeof lastTrack.stopAll === 'function')) {
      lastTrack.stopAll();
    }

    SC.stream(uri, function (sound) {
      console.log("sound:");
      console.log(sound);
      soundManager.stopAll();
      sound.play();
    });
  }

  window.playTrack = playTrack;

  function search(str) {
    lastSearch = str;

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

      console.log("first track info");
      console.log(track);

      if (tracks.length < 1) {
        log("No tracks found!");
        $list.empty();
        $('.results-footer').css("display", "none"); // hide more button
        showMessage("<b>Didn't find any songs!</b> Try a new search?", "error");
      } else {
        showMessage("<b>Here are some results.</b>", "ok");

        // send search stats
        socket.emit('stats', {
          type: "search",
          message: str
        });

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
        showMessage("<b>A single</b> character search? Really? :|", 'ok');
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
  //search("melody circus");

  // Few mobiles consistently break on the very first track play
  // without this "hack" - not necessarily due explicitly to
  // required touch event to play sound - a mystery fix
  var mobileBypassTrackUri = "/tracks/148734207";
  SC.stream(mobileBypassTrackUri, function (sound) {
    sound.setVolume(0);
    sound.play();
    sound.stop();
    sound.destruct();

    // parse incoming query
    function parseQuery (query) {
      var obj = {
        query: query,
        keys: [],
        vals: {}
      };

      query = query.substring(1);

      var pairs = query.split('&');
      console.log("pairs: " + pairs);

      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=', 2);
        var key = pair[0];
        var val = pair[1];
        obj.keys.push(key);
        obj.vals[key] = val;
      }

      return obj;
    }
    var query = parseQuery(window.location.search);

    // check for query terms
    setTimeout(function () {
      // search
      if (query.vals.search) {
        // make a search
        var q = query.vals.search.replace('+', ' ');
        console.log("search term: " + q);
        search(q);
      }

      // play track / id
      if (query.vals.track || query.vals.id) {
        // make a search
        var q = query.vals.track.replace('+', ' ') || query.vals.id.replace('+', ' ');
        console.log("track/id term: " + q);
        playTrack(q);
      }

      // search term play number
      if (query.vals.search && query.vals.play) {
        var q = Math.max(0, (parseInt(query.vals.play) - 1));
        var id = '#track' + q;

        onSearchLoad = function () {
          console.log("on search load");
          $(id).click();
          onSearchLoad = null;
        };
      }

    }, 200);

  });


  /*
  setTimeout(function () {
    console.log("Play test track by id");
    playTrack('89006133');
  }, 3000);
  */

  // set up events to close modal when pressing ESC or clicking
  // the modal background
  var elInput = input.get(0);

  document.getElementById('modal-bg').onclick = function () {
    hideModal();
  };

  window.onkeyup = function (e) {
    var key = e.keyCode || e.which;
    if (key == 27) { // ESC
      hideModal();
    }
  }

  // focus search bar on key press when not already active
  window.onkeypress = function (e) {
    if (e.which !== 0 && !elInput.activeElement) {
      elInput.focus();
    };
  };


  if (ENV != 'dev') {
    console.log = function (args) {
      return;
    };
  }
});

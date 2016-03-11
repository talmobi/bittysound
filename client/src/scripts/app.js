var test_track = "/tracks/293";

var uri = "https://api.soundcloud.com" + test_track;
var template_uri = "https://api.soundcloud.com";

//var iframeEl = document.getElementById('sc-widget');
//var WIDGET = SC.Widget('sc-widget');

var __els = {};
var clipboard = null;

var widgets = {};
var current_widget = null;
var WIDGET = {
  pause: function () {},
  stop: function () {},
  play: function () {}
};

// check if mobile (not 100% accurate)
var isMobile = false; //initiate as false
// device detection
 if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
     || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { isMobile = true };

console.log(">> IS MOBILE: " + isMobile);

var auto_play = true;
var __initialized = false;
var __first = true;

function widgets_clear () {
  __els = [];

  var divEl = document.getElementById('hidden-area-id');

  while (divEl.firstChild) {
    var el = divEl.firstChild;
    if (current_widget && el.__id == current_widget.__id)
      break;
    divEl.removeChild(el);
  }

  while (divEl.lastChild) {
    var el = divEl.lastChild;
    if (current_widget && el.__id == current_widget.__id)
      break;
    divEl.removeChild(el);
  }
};

function get_track_id (track) {
  console.log(track);
  if (track.lastIndexOf('/')) {
    return track.slice( track.lastIndexOf('/') + 1);
  } else {
    return track;
  }
};

function load_widget_track (track) {
  console.log("LOAD WIDGET TRACK");

  var divEl = document.getElementById('hidden-area-id');
  var template_uri = "https://w.soundcloud.com/player/?url=";
  var src = template_uri + (track.uri || track);

  var track_id = get_track_id(track);
  console.log("track_id: " + track_id);

  var iframeEl = document.createElement('iframe');
  iframeEl.width = "100%";
  iframeEl.height = "166";
  iframeEl.scrolling = "no";
  iframeEl.frameborder = "no";
  iframeEl.src = src;
  iframeEl.show_artwork = false;
  iframeEl.show_comments = false;
  iframeEl.show_playcount = false;
  iframeEl.show_user = false;
  iframeEl.show_track = false;
  iframeEl.__id = track_id;
  iframeEl.__track = track;
  iframeEl.__ready = false;
  divEl.appendChild(iframeEl);

  var w = SC.Widget(iframeEl);
  widgets[track_id] = w;

  w.bind(SC.Widget.Events.READY, function () {
    console.log("widget onReady called");
    var icon = __els[track_id];
    icon.removeClass("icon-pause icon-spin3 animate-spin");
    icon.addClass("icon-play");
    iframeEl.__ready = true;
    w.__ready = true;
  });

  w.bind(SC.Widget.Events.FINISH, function () {
    console.log("widget onFinish called");
  });

  w.__id = track_id;
  w.__track = track;


  console.log("widget loaded, uri: " + src);
};

function onReady () {
  return console.log("onReady called.");

  if (auto_play && __initialized && !__first) {
    setTimeout(function () {
      WIDGET.play();
    }, 100);
  }

  __first = false;
};

function onFinish () {
  return console.log("onFinished called.");
};

init();

//WIDGET.bind(SC.Widget.Events.READY, onReady);
//WIDGET.bind(SC.Widget.Events.FINISH, onFinish);

function attachEvents (widget) {
};

function init () {
  console.log(">>> MY APP INIT CALLED <<<");
  var client_id = "c904db093e9f1cf88fbb34fbd9624b19";

  SC.initialize({
    client_id: client_id
  });

  var host = window.location.protocol + "//" + window.location.host;

  var ENV = 'dev';

  if (window.location.host.indexOf('local') < 0 &&
      window.location.host.indexOf('192.168') < 0) {
    ENV = 'production';
  };

  function widget_play (track) {
    var track_id = get_track_id(track.uri);

    // TOUCH EVENT ENDED
    socket.emit('stats', {
      type: "widget play, index: " + track.index + ", track: " + track_id,
      track: track,
    });

    WIDGET = widgets[track_id];

    console.log("> Track Index: " + track.index);

    return WIDGET.play();
  };

  var selected_track_url = null;
  var selected_track_id = null;

  /* Setup socket.io to listen for live progress on a download
   * */
  if (ENV == 'dev') {
    socket = io();
  } else {
    var wsurl = "d.teenysong.com:3050";
    socket = io(wsurl);
  }

  setTimeout(function () {
    if (socket) {
      socket.emit('stats', {
        type: "device: " + (isMobile ? 'mobile' : 'pc')
      });
    }
  }, 300);

  socket.on('hello', function (data) {
    console.log("hello from server: " + data);
  });

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
      setProgress(3); // show progress bar
      // trigger download
      // socket.io listen for live progress updates on the track download
      console.log("emitting download: " + selected_track_id);
      setTimeout(function () {
        socket.emit('download', {
          trackId: selected_track_id
        });
      }, 100);
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
    //console.log("Received progress from server: %s", data.percent);
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

  // PLAY TRACK, ELEMENT
  function play(track, $listElement) {
    log("URI: " + track.uri);

    if (lastTrack == track) { // same element as before
      if ($lastIcon.hasClass('animate-spin')) {
        $lastIcon.removeClass("icon-pause icon-spin3 animate-spin");
        WIDGET.pause();
        return;
      }

      if ($lastIcon.hasClass('icon-pause')) { // sound is playing -> pause it
        WIDGET.pause();
        $lastIcon.removeClass("icon-pause icon-spin3 animate-spin");
        return;
      } else { // sound was not playing -> play it
        WIDGET.play();
        $lastIcon.removeClass("icon-pause icon-spin3 animate-spin");
        $lastIcon.addClass("icon-pause");
        return;
      }
    } else { // playing completely new track
      WIDGET.pause();
      if ($lastIcon) {
        $lastIcon.removeClass("icon-pause icon-spin3 animate-spin");
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
            WIDGET.getPosition(function (position) {
              if (!e.spinning)
                return;
              if (position < 1) // once actually playing
                return;
              log("Music started to play.");
              e.removeClass("icon-spin3 animate-spin icon-block");
              e.spinning = false;
              if (this._timeout)
                clearTimeout(this._timeout);
            })
          },
          onfinish: function () {
            log(" >>> ONFINISH CALLED");
            e.removeClass("icon-pause");
          }
        };
      })();
    }

    var uri = track.uri || track;
    uri = uri.slice(uri.indexOf('/tracks'));
    log("URI: " + uri);

    widget_play(track);
    window.current = uri;

    var __e = $i;

    var w = WIDGET;
    w.bind(SC.Widget.Events.PLAY_PROGRESS, function () {
      console.log("widget play_progress called");
      __e.removeClass("icon-spin3 animate-spin icon-block");
      __e.spinning = false;
      w.unbind(SC.Widget.Events.PLAY_PROGRESS);
    });

    current_widget = WIDGET;

    //var track_id = get_track_id(track);
    //e.removeClass("icon-spin3 animate-spin icon-block");
    //e.spinning = false;

    //WIDGET.bind(SC.Widget.Events.FINISH, opts.onfinish);
    //WIDGET.bind(SC.Widget.Events.PLAY_PROGRESS, opts.whileplaying);

      if ($i) {
        $i.addClass("icon-pause");
      }

    lastSound = {
      uri: uri,
      stop: function () {
        WIDGET.pause();
        WIDGET.seekTo(0);
      },
      setPosition: function (pos) {
        WIDGET.seekTo(pos);
      },
      play: function () {
        WIDGET.play();
      }
    };

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

    log("track: " + tracks[0].uri);

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

      load_widget_track(t.uri);
      t.index = i;

      // add query param 'title' for custom default name
      track_url += "?title=" + shortTitle;

      var textToCopy = (host + '/?search='+ lastSearch.replaceAll(' ', '+') +'&play=' + i);

      var ani = animation || 'fadeIn';
      // create list item (track)
      var $el = $(
        '<li class="list-item ' + ani + ' animated">' +
          '<button id="track'+i+'" class="icon-play"></button>' +
          '<span class="title">' +
            t_title +
          '</span>' +
          '<div class="right">' +
            '<button class="icon-export" data-clipboard-text="'+textToCopy+'" ></button>' +
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
      ii.addClass("icon-spin3 animate-spin");
      ii.trackNumber = i;
      ii.track = t;
      (function(){
        var e = $el;
        ii.on('click', function (evt) {
          __last_evt = this;
          evt.preventDefault();
          log("click: " + e.track.uri);
          play(e.track, e);
          // CAUGHT
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

          var textToCopy = (host + '/?search='+ lastSearch.replaceAll(' ', '+') +'&play=' + self.trackNumber);
          //showNotice(host + '/?search='+ lastSearch +'&track=' + self.trackId, 'info');

          window.location.href = textToCopy;

          ii_export['data-clipboard-text'] = textToCopy;

          //showNotice("link copied to clipboard!");

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

      __els[_track_id] = ii;
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
      WIDGET.pause();
      WIDGET.seekTo(0);
    }

    widget_play(uri)
  }

  window.playTrack = playTrack;

  // SEARCH
  function search(str) {
    lastSearch = str;

    // set spinning icon to signify loading
    showMessage(null, 'ok');
    showNotice(null); // clear the notice
    $text.removeClass().html('').addClass('icon-spin3 animate-spin');

    var params = {
      q: str,
      limit: defaultLimit
    }

    SC.get("/tracks", params).then(function (tracks) {
      currentTrackIndex = 0;
      lastTracks = tracks;
      $('#more-button').html("More results").removeClass().addClass('icon-plus');
      var track = tracks[0];

      for (var i = 0; i < tracks.length; i++) {
        tracks[i].index = i;
      }

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
        widgets_clear();

        // Initial amount of tracks to show after search
        addMoreTracks(4);
        $('.results-footer').css("display", "block"); // show more button
      }
    }); // eof SC.get
  }

  var inputWatermarkText = "Search for any song";
  var input = $('.searchbar input');

  var _timeout_time = 600;
  if (isMobile) {
    _timeout_time = 2000;
  }

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
        showMessage("<b>Search</b> something more than a single letter please :|", 'ok');
        return;
      }
      search(input.val());
    }, _timeout_time);
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

  __initialized = true;
  console.log("app initialized");

  // query url auto search
  var href = window.location.search.substring(1);
  var kv = href.split('&');
  var queryString = {};
  for (var i = 0; i < kv.length; i++) {
    var s = kv[i].split('=');
    var k = s[0];
    var v = s[1];
    queryString[k] = v;
  };
  console.log("queryString: " + queryString.search);

  var queryPlay = false;

  var querySearch = function () {
    if (!queryString.search)
      return;

    if (!query_search_called) {
      query_search_called = !query_search_called;
      console.log(" >>>>>>>>> GOT FOCUS <<<<<<<<<<<<<");
      if (queryString.search.length > 2) {
        search(queryString.search);
        if (queryString.play >= 0) {
          var divEl = document.getElementById('hidden-area-id');
          var interval = null;
          interval = setInterval(function () {
            console.log(">interval< " + queryString.play);

            var num = queryString.play - 1;
            var el = document.getElementById('track' + num);
            console.log(el);
            var $el = $(el);

            if ($el.hasClass('icon-play') && !$el.hasClass('animate-spin') && !queryPlay) {
              queryPlay = true;
              setTimeout(function () {
                $el.click();
                console.log("QUERY PLAY: " + queryString.play);
              }, 200);
              clearInterval(interval);
            }
          }, 400);
        }
      }

    }
  };

  var query_search_called = false;
  if (!document.hasFocus()) {
    window.addEventListener('focus', querySearch);
  } else {
    querySearch();
  }
}


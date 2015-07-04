module.exports = function (app) {
  // request moule auto handles https and follows redirects
  var request = require('request');
  var fs = require('fs');

  // keep track of downloaded songs and size on dik
  var cache = require('./cache');

  //var trackId = '89006133'; // sample track
  var dir = './songs/';
  var uriTemplate = "http://api.soundcloud.com/tracks/<trackId>/stream?client_id=711c21de667ecd3ea4e91721e5a4fae1";

  var KB_IN_BYTES = 1024 * 1024;

  var MAX_CONCURRENT_DOWNLOADS = 10;
  var concurrent_downloads = 0;

  var Downloader = {
    list: [],
    update: function () {
      if (concurrent_downloads < MAX_CONCURRENT_DOWNLOADS) {
        // get first (oldest) download
        var download = this.list.splice(0, 1)[0];
        // fire the download callback
        if (typeof download === 'function') {
          console.log("queue advanced");
          download();
        }
      } else {
        // should be fired again automatically when previous
        // download finishes or when queue list changes
      }
    },
    queue: function (trackId, res) {
      var self = this;
      var download = function () {
        concurrent_downloads++;

        requestTrack(trackId, function (err, url) {
          concurrent_downloads--;
          self.update(); // ready for new downloads

          if (err) {
            return res.status(500).json({
              message: 'Error while downloading track',
              err: err
            }).end();
          }
          return res.redirect(url);
        })
      };

      this.list.push(download);
      this.update();
    }
  };


  // download track by id from soundcloud
  function requestTrack (trackId, next) {
    var uri = uriTemplate.replace('<trackId>', trackId);
    var file = "";

    request(uri, function (err, res, body) {
      if (!err && res.statusCode == 200) {
        console.log("Successfully downloaded track, saving to disk...");

        // save track to disk
        var data = new Buffer(file, 'binary');
        var fileName = trackId + '.mp3';
        var filePath = dir + fileName;
        fs.writeFile(filePath, data, function (err) {
          if (err) {
            console.log("Error saving file ["+fileName+"]  to disc.");
            return next(err);
          } else {
            console.log("Successfully saved file to disk!");
            var url = '/songs/' + fileName;
            return next(null, url);
          }
        });
      } else {
        console.log("Error requesting Track: " + err);
        return next(err || "error");
      }

    }).on('data', function (data) {
      file += data.toString('binary');
    }).on('end', function () {
      console.log("filesize: " + file.length / (KB_IN_BYTES) + " MB");
    });
  }

  // setup app routes
  app.get('/track/:id', function (req, res) {

    var trackId = req.params.id;

    // check if the track has already been downloaded,
    var url = cache.getUrl( trackId );
    if (url) {
      // and respond with the url
      return res.redirect(url);
    } else {
      // if not, then download the track and respond with the url
      Downloader.queue(trackId, res);
    }
  });
}

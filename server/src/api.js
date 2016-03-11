var ps = require('./progress_server');

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
    queue: function (info, res) {
      /*
       * info = {req, trackId}
       *
       * */
      var req = info.req;
      var trackId = info.trackId;
      var fileName = trackId;
      try {
        fileName = req.query.title || trackId;
        fileName.trim();
      } catch (err) {
        fileName = trackId;
      };

      var self = this;
      var download = function () {
        concurrent_downloads++;

        requestTrack(trackId, {}, function (err, data) {
          concurrent_downloads--;
          self.update(); // ready for new downloads

          if (err) {
            return res.status(500).json({
              message: 'Error while downloading track',
              err: err
            }).end();
          }

          if (data.file) {
            console.log("sendng binary data file to user");
            return res.set({
              'Content-disposition': 'attachment; filename="'+ fileName +'".mp3',
              'Content-type': 'audio/mpeg3'
            }).end(data.file, 'binary');
          } else {
            console.log("sendng file to user");
            return res.set({
              'Content-disposition': 'attachment; filename="'+ filename +'".mp3',
              'Content-type': 'audio/mpeg3'
            }).sendFile(__dirname + url);
          }

        })
      };

      this.list.push(download);
      this.update();
    }
  };


  // download track by id from soundcloud
  function requestTrack (trackId, opts, next) {
    var uri = uriTemplate.replace('<trackId>', trackId);
    var file = "";

    var contentLength = 1024 * 10;

    request(uri, function (err, res, body) {
      if (!err && res.statusCode == 200) {
        console.log("Successfully downloaded track");

        // save track to disk
        var data = new Buffer(file, 'binary');
        var fileName = (trackId) + '.mp3';
        var filePath = dir + fileName;

        if (!opts || !opts.saveToDik) {
          return next(null, {
            file: data
          });
        } else {
          fs.writeFile(filePath, data, function (err) {
            if (err) {
              console.log("Error saving file ["+fileName+"]  to disc.");
              return next(err);
            } else {
              console.log("Successfully saved file to disk!");
              var url = '/songs/' + fileName;
              return next(null, {
                url: url,
              });
            }
          });
        }
      } else {
        console.log("Error requesting Track: " + err);
        return next(err || "error");
      }

    }).on('data', function (data) {
      file += data.toString('binary');
      var length = (file.length);
      var percent = (length / contentLength) * 100;
      ps.update(trackId, percent);
    }).on('end', function () {
      ps.clear(trackId);
      console.log("filesize: " + file.length / (KB_IN_BYTES) + " MB");
    }).on('response', function (response) {

      contentLength = (
          response.headers['content-length'] ||
          response.headers['Content-Length'] ||
          response.headers['content-Length'] ||
          response.headers['Content-length']
          );
      console.log("length: " + contentLength);
    });
  }

  // setup app routes
  app.get('/track/:id', function (req, res) {

    var id = req.params.id;
    var trackId = id;

    console.log("track id: " + trackId);

    // check if the track has already been downloaded,
    var url = cache.getUrl( trackId );
    if (url) {
      // and respond with the url
      return res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'filename="' + url + '"'
      }).sendFile(url);
    } else {
      // if not, then download the track and respond with the url
      Downloader.queue({
        req: req,
        trackId: trackId
      }, res);
    }
  });
}

var fs      = require('fs'),
    path    = require('path'),
    zlib    = require('zlib'),
    express = require('express'),
    app     = express(),
    multer  = require('multer'),
    tar     = require('tar'),
    _       = require('lodash'),
    config  = fs.existsSync(path.normalize('./config.json')) ?
      require('./config.json') : {};

config.port      = config.port      || 8080;
config.hostname  = config.hostname  || '127.0.0.1';
config.endpoint  = config.endpoint  || '/';
config.dest      = config.dest      || __dirname + '/uploads/';
config.keyHeader = config.keyHeader || 'X-Upload-Key';

app.use(config.endpoint, multer()) ;

app.post(config.endpoint, function(req, res) {
  if(config.key && req.get(config.keyHeader) !== config.key) {
    res.status(400).end();
    return;
  }

  var files = _.toArray(req.files);
  if(files.length < 1) {
    res.status(400).end();
    return;
  }

  var file = files[0];
  if(!/\.tar\.gz$/.test(file.originalname)) {
    res.status(400).end();
    return;
  }

  fs.createReadStream(file.path)
  .pipe(zlib.createGunzip())
  .pipe(tar.Extract({
    path: config.dest,
    strip: 0
  }))
  .on('error', function() {
    res.status(500).end(file.originalname + " unpacking failed.\n");
    fs.unlink(file.path);
  })
  .on('end', function() {
    res.end(file.originalname + "unpacked successfully.\n");
    fs.unlink(file.path);
    console.log(file.originalname + " unpacked to: " + config.dest);
  });
});

app.listen(config.port, config.hostname, function() {
  console.log("Running with config:", config);
});


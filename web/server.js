var express = require('express'),
    app = express().use(express.static(__dirname + '/../frontend')),
    async = require('async'),
    request = require('request'),
    bootes = require('bootes')().use('docker-link').use('aquila');

// proxy orders to the api service
app.use('/orders', function(req, resp) {
  req.pipe(request(service_map.api.url + "/orders" + req.url)).pipe(resp);
});

var service_map = {
  "api": {}
};

// Lookup our service URLs
function discoverService(name, cb) {
  bootes.discover(name, function(err, url) {
    if (err) {
      return cb(err);
    }
    if (!url) {
      return cb('Error discovering service ' + name);
    }
    console.log('service %s has url %s', name, url);
    service_map[name] = {url: url};
    cb();
  });
}

async.each(Object.keys(service_map), discoverService, function(err) {
  if (err) {
    return console.error(err);
  }
  var server = app.listen(3000);
});

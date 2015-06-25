var express = require('express'),
    app = express().use(express.static(__dirname + '/../frontend')),
    request = require('request'),
    discovery = require('../lib/discovery'),
    service_map = {},
    server;

// proxy orders to the api service
app.use('/orders', function(req, resp) {
  req.pipe(request(service_map.api.url + "/orders" + req.url)).pipe(resp);
});

discovery.discoverAll(["api"], function(err, services) {
  if (err) {
    return console.error(err);
  }
  service_map = services;

  server = app.listen(3000);
});

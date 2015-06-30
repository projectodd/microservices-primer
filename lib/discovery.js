/* jshint node:true */

"use strict";

module.exports = (function() {
  var bootes = require('bootes')().use('docker-link').use('aquila'),
      async = require('async'),
      service_map = {};

  function advertise(name, url) {
    console.info('disco: advertising service %s with url %s', name, url);

    return bootes.advertise(name, url);
  }

  function discover(name, cb) {
    if (service_map.hasOwnProperty(name)) {
      return cb(null, service_map[name]);
    }

    bootes.discover(name, function(err, url) {
      if (err) {
        return cb(err);
      }
      if (!url) {
        var msg = 'Failed to discover ' + name;
        console.warn('disco: ' + msg);
        return cb(msg);

      }
      console.info('disco: service %s has url %s', name, url);
      service_map[name] = {url: url};
      return cb(null, Object.create(service_map[name]));
    });
    return null;
  }

  function discoverAll(names, cb) {
    async.map(names, discover, function(err) {
      cb(err, Object.create(service_map));
    });
  }

  return {advertise: advertise,
          discover: discover,
          discoverAll: discoverAll};
})();

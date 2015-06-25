var express = require('express'),
    app = express().use(express.static(__dirname + '/../frontend')),
    body_parser = require('body-parser')(),
    async = require('async'),
    request = require('request'),
    bootes = require('bootes')().use('docker-link').use('aquila'),
    fartgun = require('../fartgun'),
    rain_circuit = fartgun({name: "rain",
                            onclose: function () {console.log("rain CLOSED");},
                            onopen: function () {console.log("rain OPENED");}});

var service_map = {
  "rain": {},
  "umbrella_orders": {},
  "sms": {}
};

// Create a new order
app.post('/orders', body_parser, function(req, res){
  var order = req.body;
  if (!order.city || !order.country || !order.accountManager || !order.quantity){
    return res.status(400).json({error : "Error - orders should contain a city, country, quantity and specify an account manager"});
  }
  // 1. See what the rainfall will be
  var rain_opts = {url: service_map.rain.url,
                   qs: {city: order.city,
                        country: order.country},
                   json: true},
      rain_cb = function(err, response, rainServiceBody){
        // 2. Adjust order for rainfall
        var rainfall = rainServiceBody.rainfall;
        // + 1 because rainfall could be 0 inches - we don't want 0 orders
        order.quantity = order.quantity * (rainfall + 1);
        // 3. Create the order in our database
        request.post({url : service_map.umbrella_orders.url, json : order }, function(err, response, umbrellaServiceBody){
          if (err) {
            console.error(err);
            return res.status(500).json({error: err});
          }
          // 4. Generate the SMS notification
          var sms = { to : order.accountManager, message : "New order created for " + order.quantity + " umbrellas!"};
          request.post({url : service_map.sms.url, json : sms }, function(err, response, smsServiceBody){
            if (err) {
              console.error(err);
              return res.status(500).json({error: err});
            }
            // 5. All done! Back to the client
            return res.json(order);
          });
        });
      };

  request.get(rain_opts,
              rain_circuit.wrap_callback(rain_cb,
                                         // fallback args - passed to the callback as cb(null, {}, {rainfall: 0})
                                         [{}, {rainfall: 0}]));
});



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

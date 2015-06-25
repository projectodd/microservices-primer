var app = require('express')(),
    body_parser = require('body-parser')(),
    request = require('request'),
    ip = require('ip'),
    discovery = require('../lib/discovery'),
    fartgun = require('../lib/fartgun'),
    rain_circuit = fartgun({name: "rain",
                            onclose: function () {console.log("rain CLOSED");},
                            onopen: function () {console.log("rain OPENED");}});

var service_map = {};

// Create a new order
app.post('/api/orders', body_parser, function(req, res){
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


discovery.discoverAll(["rain", "sms", "umbrella_orders"], function(err, services) {
  if (err) {
    return console.error(err);
  }
  service_map = services;
  var server = app.listen(3004, function() {
    var url = 'http://' + ip.address() + ':' + server.address().port + "/api";
    discovery.advertise('api', url);
  });
});

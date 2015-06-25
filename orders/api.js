var app = require('express')(),
    body_parser = require('body-parser')(),
    request = require('request'),
    ip = require('ip'),
    discovery = require('../lib/discovery'),
    fartgun = require('../lib/fartgun'),
    rain_circuit = fartgun({name: "rain",
                            onclose: function () {console.log("rain CLOSED");},
                            onopen: function () {console.log("rain OPENED");}}),
    sms_circuit = fartgun({name: "sms"
                           // maybe retry pending sms's when the
                           // circuit reopens?
                          }),
    service_map = {},
    server;

// create a new order
app.post('/api/orders', body_parser, function(req, res){
  var order = req.body;
  if (!order.city || !order.country || !order.accountManager || !order.quantity){
    return res.status(400).json({error : "Error - orders should contain a city, country, quantity and specify an account manager"});
  }

  var rain_cb = function(err, response, rainServiceBody){
    // 2. Adjust order for rainfall
    var rainfall = rainServiceBody.rainfall;

    order.quantity = Math.round(order.quantity * (rainfall === 0 ? 1 : rainfall));

    var order_cb = function(err, response, umbrellaServiceBody){
      if (err) {
        console.error(err);
        return res.status(500).json({error: err});
      }

      var sms = {to: order.accountManager,
                 message: "New order created for " +
                 order.quantity + " umbrellas!"};

      var store_sms = function() {
        //no-op, but would store the sms for future send in case of failure
        console.error("Storing sms for recovery");
      };

      var sms_cb = function(err, response, smsServiceBody){
        if (err) {
          console.error("sms failed: %j", err);
          // store message somewhere for a future resend
          store_sms();
        }
      };

      // 4. Generate the SMS notification
      request.post({url: service_map.sms.url,
                    json: sms},
                   sms_circuit.wrap_callback(sms_cb, store_sms));

      // we don't make the order contingent on notifying the mgr

      // 5. All done! Back to the client
      return res.json(order);
    };

    // 3. Create the order in our database
    request.post({url: service_map.umbrella_orders.url,
                  json: order}, order_cb);
  };

  // 1. See what the rainfall will be
  request.get({url: service_map.rain.url,
               qs: {city: order.city,
                    country: order.country},
               json: true},
              rain_circuit.wrap_callback(rain_cb,
                                         // fallback args - passed to the callback as cb(null, {}, {rainfall: 0})
                                         [{}, {rainfall: 0}]));
});


discovery.discoverAll(["rain", "sms", "umbrella_orders"], function(err, services) {
  if (err) {
    return console.error(err);
  }
  service_map = services;
  server = app.listen(3004, function() {
    var url = 'http://' + ip.address() + ':' + server.address().port + "/api";
    discovery.advertise('api', url);
  });
});

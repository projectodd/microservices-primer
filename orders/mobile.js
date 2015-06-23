var app = require('express')().use(require('body-parser')()).use(require('cors')()),
    async = require('async'),
    request = require('request'),
    Bootes = require('bootes'),
    bootes = new Bootes();

var service_map = {
  "rain": {},
  "umbrella_orders": {},
  "sms": {}
};

// Create a new order
app.post('/orders', function(req, res){
  var order = req.body;
  if (!order.city || !order.country || !order.accountManager || !order.quantity){
    return res.status(400).json({error : "Error - orders should contain a city, country, quantity and specify an account manager"});
  }
  // 1. See what the rainfall will be
  request.get({url : service_map.rain.url, qs : { city : order.city, country : order.country }, json : true}, function(err, response, rainServiceBody){
    // 2. Adjust order for rainfall
    var rainfall = rainServiceBody.rainfall;
    order.quantity = order.quantity * (rainServiceBody.rainfall + 1); // + 1 because rainfall could be 0 inches - we don't want 0 orders
    // 3. Create the order in our database
    request.post({url : service_map.umbrella_orders.url, json : order }, function(){
      // 4. Generate the SMS notification
      var sms = { to : order.accountManager, message : "New order created for " + order.quantity + " umbrellas!"};
      request.post({url : service_map.sms.url, json : sms }, function(err, response, smsServiceBody){
        // 5. All done! Back to the client
        return res.json(order);
      });
    });
  });
});



// Lookup our service URLs
bootes.use('aquila');

function discoverService(name, cb) {
  bootes.discover(name, function(err, url) {
    if (err) {
      return cb(err);
    }
    if (!url) {
      return cb('Error discovering service ' + name);
    }
    service_map[name] = {url: url};
    cb();
  });
}

async.each(Object.keys(service_map), discoverService, function(err) {
  if (err) {
    return console.error(err);
  }
  var server = app.listen(3003);
});

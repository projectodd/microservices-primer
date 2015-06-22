var app = require('express')().use(require('body-parser')()).use(require('cors')()),
request = require('request');

var service_map = {
  "umbrella_orders" : { url : 'http://localhost:3000/orders/umbrellas' },
  "rain" : { url : 'http://localhost:3001/rain' },
  "sms" : { url : 'http://localhost:3002/sms' }
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

var server = app.listen(3003);

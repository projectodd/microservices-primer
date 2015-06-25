var app = require('express')().use(require('body-parser')()).use(require('cors')()),
    ip = require('ip'),
    discovery = require('../lib/discovery');

var umbrella_orders = [];
// Create a new order
app.post('/orders/umbrellas', function(req, res){
  umbrella_orders.push(req.body);
  return res.json(req.body);
});
// list orders
app.get('/orders/umbrellas', function(req, res){
  return res.json(umbrella_orders);
});

var server = app.listen(3003, function() {
  var url = 'http://' + ip.address() + ':' + server.address().port + '/orders/umbrellas';
  discovery.advertise('umbrella_orders', url);
});

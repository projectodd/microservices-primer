var app = require('express')().use(require('body-parser')()).use(require('cors')()),
    bootes = require('bootes')().use('aquila'),
    ip = require('ip');

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

var server = app.listen(3000, function() {
  var url = 'http://' + ip.address() + ':' + server.address().port + '/orders/umbrellas';
  console.log('umbrella_orders advertising service url %s', url);
  bootes.advertise('umbrella_orders', url);
});

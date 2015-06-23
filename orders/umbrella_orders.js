var app = require('express')().use(require('body-parser')()).use(require('cors')()),
    Bootes = require('bootes'),
    bootes = new Bootes(),
    ip = require('ip');

bootes.use('aquila');

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
  bootes.advertise('umbrella_orders', url);
});

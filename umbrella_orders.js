var app = require('express')().use(require('body-parser')());

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

var server = app.listen(3000);

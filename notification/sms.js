var app = require('express')().use(require('body-parser')()),
    Bootes = require('bootes'),
    bootes = new Bootes(),
    jStat = require('jStat').jStat;

bootes.use('aquila');
bootes.advertise('sms', 'http://localhost:3002/sms');

app.use(require('cors')());
// Create a new order
app.post('/sms', function(req, res){
  var to = req.body.to, 
      message = req.body.message;

  // This will return a delay with a mean of 100ms but with a max
  // value of 1-2 seconds
  var delay = jStat.exponential.sample(0.01);
  setTimeout(function() {
    return res.json(message);
  }, delay);
});

var server = app.listen(3002);

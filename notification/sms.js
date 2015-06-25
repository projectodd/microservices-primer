var app = require('express')().use(require('body-parser')()),
    bootes = require('bootes')().use('aquila'),
    ip = require('ip'),
    jStat = require('jStat').jStat;

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

var server = app.listen(3002, function() {
  var url = 'http://' + ip.address() + ':' + server.address().port + '/sms';
  console.log('sms advertising service url %s', url);
  bootes.advertise('sms', url);
});

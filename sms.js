var app = require('express')().use(require('body-parser')());
var twilio = require('twilio');
var client = new twilio.RestClient(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
// Create a new order
app.post('/sms', function(req, res){
  var to = req.body.to, 
  message = req.body.message;
  client.sms.messages.create({ to: to, from : process.env.TWILIO_NUM, body : message}, function(error, messageResponse){
    return res.json(message);
  });
});

var server = app.listen(3002);

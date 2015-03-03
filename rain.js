var app = require('express')();
var request = require('request');
var _ = require('underscore');
var weatherUrl = 'http://api.openweathermap.org/data/2.5/forecast';

// Create a new order
app.get('/rain', function(req, res){
  var city = req.query.city, 
  country = req.query.country;
  
  request.get({url : weatherUrl + '?q=' + city + ',' + country, json : true}, function(err, response, body){
    // sum all the inches rainfall in the forecast
    var totalRainfall = _.reduce(body.list, function(a, b){ return a + b.rain['3h'] }, 0);
    return res.json({rainfall : totalRainfall });
  });
});

var server = app.listen(3001);

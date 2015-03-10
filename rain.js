var app = require('express')();
var request = require('request');
var _ = require('underscore');
var weatherUrl = 'http://api.openweathermap.org/data/2.5/forecast';

app.get('/rain', function(req, res){
  var city = req.query.city, 
  country = req.query.country;
  
  request.get({url : weatherUrl + '?q=' + city + ',' + country, json : true}, function(err, response, weatherbody){
    // sum all the inches rainfall in the forecast
    weatherbody.rainfall = _.reduce(weatherbody.list, function(a, b){ 
      var b = b.rain && b.rain['3h'] || 0;
      return a + b;
    }, 0);
    return res.json(weatherbody);
  });
});

var server = app.listen(3001);

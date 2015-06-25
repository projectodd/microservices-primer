var app = require('express')(),
    ip = require('ip'),
    fs = require('fs'),
    jStat = require('jStat').jStat,
    path = require('path'),
    request = require('request'),
    _ = require('underscore'),
    discovery = require('../lib/discovery');

// hardcode some json response so we don't hit a live API
var jsonFile = path.resolve(__dirname + '/' + 'weather_response.json');
var weatherData = JSON.parse(fs.readFileSync(jsonFile));

app.use(require('cors')());

app.get('/rain', function(req, res){
  var city = req.query.city,
      country = req.query.country,
      weatherbody = weatherData;

    // sum all the inches rainfall in the forecast
    weatherbody.rainfall = _.reduce(weatherbody.list, function(a, b){
      var b = b.rain && b.rain['3h'] || 0;
      return a + b;
    }, 0);
  // This will return a delay with a mean of 200ms but with a max
  // value of 3-4 seconds
  var delay = jStat.exponential.sample(0.005);
  setTimeout(function() {
    return res.json(weatherbody);
  }, delay);
});

var server = app.listen(3001, function() {
  var url = 'http://' + ip.address() + ':' + server.address().port + '/rain';
  discovery.advertise('rain', url);
});

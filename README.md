#A MicroServices Primer in Node.js
There seems to have been a tangible explosion in the use of the term “micro services”. I’ve been peripherally aware of the concept for some time now, but it seems it first came to light with a fantastic collection of thoughts by Martin Fowler[1] - some great reading on the topic.
  
I’ve been somewhat amused by this term, since we've been composing small, loosely coupled applications which combine to do work since I first started using Node.js with FeedHenry. I'd love to claim some visionary stroke of trend-predicting genius, but really it’s the path the Node.js community lead us down.  
  
What started as cries of “Make everything you possibly can small re-usable modules” (micromodules anybody?) quickly became "make everything small re-usable applications”, and now we're calling them microservices. Great!


##What’s a micro service look like?
Let's make a micro service for orders for our travelling umbrella sales team. Here's a service which can both create and list umbrella orders. It creates a REST api, `/orders`. 

    var app = require('express')().use(require('body-parser')());

    var orders = [];
    // Create a new order
    app.post('/orders', function(req, res){
      orders.push(req.body);
      return res.json(req.body);
    });
    // list orders
    app.get('/orders', function(req, res){
      return res.json(orders);
    });

    var server = app.listen(3000);
    
Ten lines - pretty micro, huh? Ok, so I cheated a bit - that first line is concice to the point of unreadable, and we're just putting orders in memory - but you get the point, we have a _really micro_ service. 

We can create a service by doing
    

## Adding more services
Our order service is working just fine - our folk out in the field can create orders, and list the orders they've previously created. 
But before the team creates an order, they want the system to scale their order size based on the upcoming weather forecast at that location. Let's call this the rain service.
Here, we're taking the output of another service, and discarding the information which is of no use to us (since we just care about rainfall).

    var app = require('express')().use(require('body-parser')());
    var request = require('request');
    var _ = require('underscore');
    var weatherUrl = 'http://api.openweathermap.org/data/2.5/forecast';

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
    
Lastly, we're also going to add a service to allow us to push an SMS alert to the account manager when a new order is created. 

##Composing into a mobile service
Now we have our two standalone microservices, let's make one cohesive API  expose for mobile - our mobile ordering service. 

	// TODO
	
##Results

	// TODO



[1] [http://martinfowler.com/articles/microservices.html](http://martinfowler.com/articles/microservices.html)
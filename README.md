#A MicroServices Primer in Node.js
There seems to have been a tangible explosion in the use of the term “micro services”. I’ve been peripherally aware of the concept for some time now, but it seems it first came to light with a fantastic collection of thoughts by Martin Fowler[1] - some great reading on the topic.

This post is not going to help you make a business case for rewriting your existing monolith as a series of microservices. I'm not going to quantify your ROI, or "leverage synergies". Instead, I'm going to attempt to illustrate using some simple examples just how easy it can be to get started with microservices. 
  
I’ve been somewhat amused by this term, since we've been composing small, loosely coupled applications which combine to do work since I first started using Node.js with FeedHenry. I'd love to claim some visionary stroke of trend-predicting genius, but really it’s the path the Node.js community lead us down.  
  
What started as cries of “Make everything you possibly can small re-usable modules” (micromodules anybody?) quickly became "make everything small re-usable applications”, and now we're calling them microservices. Great! Call them turnips for all I care.

##What’s a microservice look like?
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
    
Ten lines - pretty micro, huh? Ok, so I cheated a bit - that first line is concice to the point of unreadable, and we're just putting orders in memory - but we now have a _really micro_ service. 
  
_For future code snippets, I'm going to drop some of the boilerplate setup code._

## Adding more services
Our order service is working just fine - our folk out in the field can create orders, and list the orders they've previously created. 
But before the team creates an order, they want the system to scale their order size based on the upcoming weather forecast at that location. Let's call this the rain service.
Here, we're going to reach out to a third party API, sum the rainfall totals for the upcoming forecast, and discard all the other information. 

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
    app.listen(3001);
    
Lastly, we're also going to add a service to allow us to push an SMS alert to the account manager when a new order is created. 

	app.post('/sms', function(req, res){
	  var to = req.body.to, 
	  message = req.body.message;
	  client.sms.messages.create({ to: to, from : process.env.TWILIO_NUM, body : message}, function(error, message){
	    return res.json(message);
	  });
	});
	app.listen(3002);



##Microservices Considerations for Mobile
Introducing a microservices based architecture has some specific considerations when it comes to delivering content to mobile applications. I'm going to deal with two main concerns - coupling and performance. 

### Loose-Coupled, Tight-Coupled, Practically Welded Shut
In a web application, we know that once we deploy an update to the webapp, all our connected clients are using the new API, and we can deprecate the old one. This makes for a relatively loose coupling between client and server.

A mobile application is released into an App Store. In an enterprise environemnt, we can usually force out an update & watch it propegate to users within a matter of days, but that's still makes for a pretty tightly coupled API.  
If it's an app in the public App Store, there may be a review period. Once released, users download this update over the course of weeks, months, maybe never. I've still got to maintain my previous API, and this makes for an integration which is so tightly coupled, it's practically welded shut. (See, these days everybody is coining new terms!)  
This makes for some very special considerations when architecting for mobile.

### Performance Considerations

	// TODO - Multiple hops across edge networks is a bad idea, just make 1

##The Tale of the Travelling Umbrella Salesperson
Let's take a mock use case, that of a travelling umbrella salesperson (of no relation to the Travelling Salesperson of Distributed Computing fame). This salesperson needs to be able to:

1. Create orders in a backend database
2. Automatically scale their order quantities according to the weather (I know - work with me here, people..)
3. Notify the account manager of the new order on their account

We're going to try doing this two ways.

### Take 1: Client-Side Business Logic
First, we'll build this application how many existing mobile apps are built - we'll implement a lot of business logic on the client (steps 1, 2 and 3 above), and make three separate REST calls from the mobile device.  

Sure, we've still got microservices on the serverside - but we could equally picture this as a monolith, for what little use we're making of the microservices philosphy.  


	        +--+                   +--------+-----+ 
	        |  |  Boston, USA      |Rain Service  | 
	+-------+---------------------->              | 
	| Mobile   |3 inches of rain   |              | 
	| Client   +-------------------+              | 
	|          |                   +--------------+ 
	|          |                                    
	|          | { order }         +---------------+
	|          +-------------------> Order         |
	|          |  stored OK        | Storage       |
	|          +-------------------+ Service       |
	|          |                   |               |
	|          |                   +---------------+
	|          |                                    
	|          |to:+1234 msg:order!+--------+------+
	|          +---+---------------> SMS Service   |
	|          |                   |               |
	|          +-------------------+               |
	+----------+                   +---------------+
This illustrates the "wrong way". Now, let's examine an improved approach. 

### Take 2: Microservices for Mobile
As before, we're going to achieve this integration using a series of microserves - but we're going to meld the data together in a fourth and final mobile-specific microservice. 

		
		                        +-------------+                   +--------+-----+ 
		                        |             |  Boston, USA      |Rain Service  | 
		                        |             +------------------->              | 
		        +--+            |    Mobile   |3 inches of rain   |              | 
		        |  |            |    Ordering <-------------------+              | 
		+-------+--+            |    Service  |                   +--------------+ 
		| Mobile   |   { order }|             |                                    
		| Client   +------------>             | { order }         +---------------+
		|          |            |             +-------------------> Order         |
		|          |            |             |  stored OK        | Storage       |
		|          |            |             <-------------------+ Service       |
		|          |            |             |                   |               |
		|          |            |             |                   +---------------+
		|          |            |             |                                    
		|          |            |             |to:+1234 msg:order!+--------+------+
		|          |            |             +---+---------------> SMS Service   |
		|          | created OK |             |                   |               |
		|          <------------+             <-------------------+               |
		+----------+            +-------------+                   +---------------+

Now, we send our order information to a new mobile ordering microservice, which implements all this business logic on the server side. 
We've got one simple API to maintain, a perfectly reasonable POST of a JSON payload, and this integration becomes a much looser coupling. 
	
##Results

Finally, the good stuff. How do these two approaches compare? 
Using the first approach, our average response time over an Edge network is __978.1ms__.  
Introucing our mobile specific microservice, this average time plumets to __398.6__.


	// TODO better results - graph across some sort of scale, type of network (4G -> 3G -> 2G -> Edge), with pretty charts


[1] [http://martinfowler.com/articles/microservices.html](http://martinfowler.com/articles/microservices.html)
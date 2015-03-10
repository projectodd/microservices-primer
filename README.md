#A MicroServices Primer in Node.js
There seems to have been a tangible explosion in the use of the term “micro services”. I’ve been peripherally aware of the concept for some time now, but it seems it first came to light with a fantastic collection of thoughts by Martin Fowler[1] - some great reading on the topic.

This post is not going to help you make a business case for rewriting your existing monolith as a series of microservices. I'm not going to quantify your ROI, or "leverage synergies". Instead, I'm going to attempt to illustrate using some simple examples just how easy it can be to get started with microservices. 
  
I’ve been somewhat amused by this term, since we've been composing small, loosely coupled applications which combine to do work since I first started using Node.js with FeedHenry. I'd love to claim some visionary stroke of trend-predicting genius, but really it’s the path the Node.js community lead us down.  
  
What started as cries of “Make everything you possibly can small re-usable modules” (micromodules anybody?) quickly became "make everything small re-usable applications”, and now we're calling them microservices. Great! Call them turnips for all I care.  
Let's take a look at some simple examples. 

##What's a Microservice Look Like?

###The Tale of the Travelling Umbrella Salesperson
To illustrate the use of microservices, let's take a mock use case, that of a travelling umbrella salesperson (of no relation to the Travelling Salesperson of Distributed Computing fame). This salesperson needs to be able to:

1. Create orders in a backend database
2. Automatically scale their order quantities according to the weather (I know - work with me here, people..)
3. Notify the account manager of the new order on their account

### Our first Microservice - Orders
First, we're going to create a micro service for orders for our travelling umbrella sales team. We're going to write our microservices in Node.js, and they're going to communicate JSON payloads over HTTP, but these are by no means prerequisites. Microservices can of course be implemented using any programming language, over any communication protocol.
Here's a service which can both create and list umbrella orders. It creates a REST api, `/orders`. 

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
    
Ten lines - pretty micro, huh? Ok, so I cheated a bit - that first line is concise to the point of unreadable, and we're just putting orders in memory - but we now have a _really micro_ service. 
  
_For future code snippets, I'm going to drop some of the boilerplate setup code._

## Adding more Microservices - Weather & SMS
Our order service is working just fine - our folk out in the field can create orders, and list the orders they've previously created. 
But before the team creates an order, they want the system to scale their order size based on the upcoming weather forecast at that location. Let's call this the rain service.
Here, we're going to reach out to a third party API, sum the rainfall totals for the upcoming forecast, and append it to the original weather information. 

    var weatherUrl = 'http://api.openweathermap.org/data/2.5/forecast';

    app.get('/rain', function(req, res){
      var city = req.query.city, 
      country = req.query.country;
      
      request.get({url : weatherUrl + '?q=' + city + ',' + country, json : true}, function(err, response, weatherbody){
        // sum all the inches rainfall in the forecast
        weatherbody.rainfall = _.reduce(weatherbody.list, function(a, b){ return a + b.rain['3h'] }, 0);
        return res.json(weatherbody);
      });
    });
    
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
Now that we've set up a series of three microservices, let's pause to consider how we consume this API.  
Introducing a microservices based architecture has some specific considerations when it comes to delivering content to mobile applications. I'm going to deal with two main concerns - coupling and performance. 

### Loose-Coupled, Tight-Coupled, Practically Welded Shut
For web applications, if we change the API we know that once we deploy an update to the web application, all our connected clients are using the new API. It's easy to swap out URLs, and even expected payloads in the code of the web application, because we can deploy in tandem. Then, we can deprecate the old API. This makes for a relatively loose coupling between client and server.
  
A mobile application is released into an App Store. In an enterprise environment, we can usually force out an update to our app & watch it propagate to users within a matter of days. This makes the relationship between client and API more tightly coupled.  

If it's an app in the public App Store, there may be a review period. Once released, users download this update over the course of weeks, months, maybe never. The previous API still needs to be maintained, and this makes for an integration which is so tightly coupled, it's practically welded shut. (See, these days everybody is coining new terms!)  
This makes for some very special considerations when architecting for mobile.

### Performance Considerations
The other major consideration specific to mobile is performance. Web applications typically run on devices connected over WiFi or Ethernet, with low latency.  
Mobile devices often connect over lossy connections - 3G, Edge, or even GPRS. 

Returning the minimum payload required to render the screen is more important now than ever. Intelligent pagination on lists can drastically reduce payload size, especially when users are only operating on the most recent items. 

This also means reducing the number of calls made across the network. As the number of calls grow, every HTTP transaction can contribute to an exponential growth in overall response time. A unified mobile API which returns data from many sources in one single call is often a good option.  
This can introduce some interesting trade-offs which need to be balanced:  
1. At what point does a unified API returning multiple types of data compromise the RESTful nature of an API
2. At what point does the response body size of a combined payload negate any potential performance gains

### The Internet of Things - The Great Reset
	// TODO - Wearables, IoT. Clock resets! Even more resource constrained than mobile
	- devices can even be not powerful enough for HTTPS! 
	-JSON too big
	-IoT specific services
	- is this another blog post in itself?


##Taking our Microservices to Mobile
Now that we've built our microservices, we're going to bring them to a mobile device. 
We're going to try doing this two ways. 

### Take 1: Client-Side Business Logic
First, we'll build this application how many existing mobile apps are built - we'll implement a lot of business logic on the client (steps 1, 2 and 3 above), and make three separate REST calls from the mobile device.  

Sure, we've still got microservices on the serverside - but we could equally picture this as a monolith, for what little use we're making of the microservices philosophy.  


	        +--+                   +--------+-----+ 
	        |  |  Boston, USA      |Rain Service  | 
	+-------+---------------------->              | 
	| Mobile   |full weather data  |              | 
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
		        +--+            |    Mobile   |full weather data  |              | 
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
We've got one simple API to maintain, a perfectly reasonable POST of a JSON payload, and this integration becomes a much looser coupling. We're not sending unnecessary data back to the mobile app. 
	
##Results

Finally, the good stuff. How do these two approaches compare? 
Using the first approach, our average response time over an Edge network is __978.1ms__.  
Introducing our mobile specific microservice, this average time plummets to __398.6__.


	// TODO better results - graph across some sort of scale, type of network (4G -> 3G -> 2G -> Edge), with pretty charts


[1] [http://martinfowler.com/articles/microservices.html](http://martinfowler.com/articles/microservices.html)
#Microservices - Benchmarks
Supporting code repository to compliment microservices blog post.  
To get started with the examples provided, follow these steps in a terminal: 
    
    # To run these benchmarks, clone this repository
     git clone https://github.com/cianclarke/microservices-primer.git ; cd microservices-primer 
    # Install dependencies
     npm install -d 
    # Set Twilio environment variables - you can get these by creating a Twilio account
     export TWILIO_AUTH=foo; export TWILIO_SID=bar; export TWILIO_NUM="+1234567";
     # start the 4 microservices & the test runner
     npm start 
    # To view the test runner, visit http://localhost:3004/ in a browser. 
    
We're now running our series of microservices, and can interact with them using CURL:

	# Service 1: Create a new order in the database
	curl 'http://127.0.0.1:3000/orders/umbrellas' -H 'Content-Type: application/json' --data-binary '{"city":"Dublin","country":"Ireland","quantity":984.4999999999999,"accountManager":"+1 123 456 789"}'
	
	# Service 1: List orders in the database
	curl http://127.0.0.1:3000/orders/umbrellas
	
	# Service 2: GET request to rain service to retrieve information for Dublin, Ireland
	curl 'http://127.0.0.1:3001/rain?city=Dublin'

	# Service 3: POST to the SMS service
	curl 'http://127.0.0.1:3002/sms' -H 'Content-Type: application/json' --data-binary '{"to":"+1 123 456 789","message":"My SMS Message!"}'
  	

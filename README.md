# Node Microservices Playground

This is a very basic microservices test app forked from
https://github.com/cianclarke/microservices-primer to give us a
playground for experimenting with different ways to develop and deploy
microservices in Node.

To run the test app:

    npm install -g pm2 # if'n you don't want to ./node_modules/pm2/bin/pm2 all the time
    npm install
    npm start

You can see the running services with `pm2 list`, and stop individual
services with `pm2 stop <id>`. Run `pm2 logs` to tail all the output.

Visit http://localhost:3004/ in a browser to see the simple test
app. All interactions with external APIs are mocked so we don't
actually retrieve real weather data, send SMS, etc.

We're now running our series of microservices, and can interact with them using CURL:

    # Service 1: Create a new order in the database
    curl 'http://127.0.0.1:3000/orders/umbrellas' -H 'Content-Type: application/json' --data-binary '{"city":"Dublin","country":"Ireland","quantity":984.4999999999999,"accountManager":"+1 123 456 789"}'

    # Service 1: List orders in the database
    curl http://127.0.0.1:3000/orders/umbrellas

    # Service 2: GET request to rain service to retrieve information for Dublin, Ireland
    curl 'http://127.0.0.1:3001/rain?city=Dublin&country=Ireland'

    # Service 3: POST to the SMS service
    curl 'http://127.0.0.1:3002/sms' -H 'Content-Type: application/json' --data-binary '{"to":"+1 123 456 789","message":"My SMS Message!"}'

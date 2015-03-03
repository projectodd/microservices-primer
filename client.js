var express = require('express');
var app = express();
app.use(express.static(__dirname + '/www'));
var server = app.listen(3004);

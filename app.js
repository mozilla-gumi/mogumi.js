var express = require('express');

var config = require('./config.js');
var controller = require('./controller.js');

var app = express();

config(app, express);

controller(app);


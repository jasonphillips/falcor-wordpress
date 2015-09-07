'use strict';

// This file starts the server and exposes the Router at /model.json
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var FalcorServer = require('falcor-express');
var wordpressRouter = require('../lib/wordpressRouter.js');

var bunyan = require('bunyan');
var log = bunyan.createLogger({name: 'express'});
var endpoint = 'http://demo.wp-api.org/wp-json/wp/v2';

app.use(bodyParser.urlencoded({extended: false}));

// Simple middleware to handle get/post
app.use('/model.json', FalcorServer.dataSourceRoute(function (req, res) {
  // Not using authentication in demo
  return wordpressRouter(endpoint);
}));

app.use(express.static('.'));

let server = app.listen(9090, function (err) {
  if (err) {
    log.error(err);
    return;
  }
  log.info('navigate to http://localhost:9090');
});

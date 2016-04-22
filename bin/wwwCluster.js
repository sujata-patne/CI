#!/usr/bin/env node

/**
 * Module dependencies.
 */

//var app = require('../app');
var debug = require('debug')('adminPlan:server');
var http = require('http');
var cluster = require('cluster');
var cpus;
var i;
//var connection = require('../config/db')();


if (cluster.isMaster) {
  // The master thread is assigned the sole responsibility
  // of spawning child threads
  cpus = require('os').cpus().length;

  for (i = 0; i < cpus; i += 1) {
    // Here we create one worker thread per CPU
    cluster.fork();
  }

  Object.keys(cluster.workers).forEach(function (id) {
    console.log('I am running with id '+ cluster.workers[id].process.pid)
  })

  cluster.on('exit', function (worker) {
    console.log('Worker ' + worker.id + ' exited');
    cluster.fork();
  });

} else {
  var app = require('../config/express')();
  require('../config/routes')(app);
  /**
   * Get port from environment and store in Express.
   */

  var port = normalizePort(process.env.PORT || '4010');
  app.set('port', port);
  /**
   * Create HTTP server.
   */

  var server = http.createServer(app);

  /**
   * Listen on provided port, on all network interfaces.
   */
  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);

  console.log("Listening on port "+port);
}


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

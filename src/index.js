const logger = require('./lib/logger');
const db = require('./lib/db');
const config = require('../config');
const models = require('./components/models');
const managers = require('./components/managers');
const routes = require('./components/routes');
const express = require('express');
const http = require('http');
const https = require('https');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const requestId = require('express-request-id');
const fs = require('fs');

async function init() {
  // Init db
  await db.init();

  // Init models
  for (const model of models) {
    await model.init();
  }

  // Init managers
  for (const manager of managers) {
    await manager.init();
  }

  // Create app
  const app = express();
  
  morgan.token('body', (req, res) => req.body);
  const morganFormat = function(tokens, req, res) {
    return `Request: ${JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      body: tokens.body(req, res),
      status: tokens.status(req, res),
      responseTime: `${tokens['response-time'](req, res)} ms`,
    }, null, 4)}`;
  };

  const morganStream = {
    write: message => logger.info(message),
  };

  app.use(basicAuth({ users: { 'admin': config.password } }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(requestId());
  app.use(morgan(morganFormat));

  // Create routes
  for (const route of routes) {
    for (const [path, methods] of Object.entries(route)) {
      for (const [method, imp] of Object.entries(methods)) {
        app[method](path, imp);
      }
    }
  }

  // Start
  const port = process.env.PORT || 8080;
  
  if (process.env.NODE_ENV === 'production') {
    var key = fs.readFileSync(`${__dirname}/../certificate/key.pem`);
    var certificate = fs.readFileSync(`${__dirname}/../certificate/certificate.pem`);
    https.createServer({
      key: key,
      cert: certificate,
    }, app).listen(port);
  }
  else {
    http.createServer(app).listen(port);
  }
  logger.info(`App listening on port ${port}`);
}

init();
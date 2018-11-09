import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
// Allows the routes to throw errors
import 'express-async-errors';

import { port } from './config/general';
import logger from './config/logger';
import sequelize from './database';
import { ApiError, codes } from './errors';
import sessionMiddleware from './middlewares/session';
import loggerMiddleware from './middlewares/logger';
import AuthController from './controllers/auth';
import CategoryController from './controllers/category';

const app = express()
  .use(bodyParser.json({ limit: '5mb' }))
  .use(bodyParser.urlencoded({ limit: '5mb', extended: true }))
  .use(express.static(path.join(__dirname, '../public')))
  .use(sessionMiddleware())
  .use(loggerMiddleware())

  // Test route
  .get('/api', (req, res) => res.send('Ok.'))

  // Routes
  .use('/api/auth', AuthController)
  .use('/api/category', CategoryController)

  // Not found
  .use((req, res, next) => {
    next(new ApiError('Not found.', codes.client.NOT_FOUND));
  })

  // Error handler
  .use((error, req, res, next) => {
    logger.error('%s%s', error, error.details ? `\n\t${error.details}` : '');
    res.status(error.status || codes.server.INTERNAL_SERVER_ERROR);
    res.send(`${error.name}: ${error.message}`);
    next();
  });

const syncDatabase = callback => app.emit('sync_database', callback);
const startServer = callback => app.emit('start_server', callback);

// Sync database task
app.on('sync_database', async (callback) => {
  try {
    logger.verbose('Sync database');
    await sequelize.sync();
    callback();
  } catch (error) {
    logger.error(error);
    setTimeout(() => syncDatabase(callback), 700);
  }
});

// Start server task
app.on('start_server', (callback) => {
  logger.verbose('Starting server listener');

  const server = app.listen(port, (error) => {
    if (error) {
      logger.error('Error on server listener: %s', error.log());
      setTimeout(startServer, 700);
    } else {
      logger.info(`Server listening on port ${port}`);
      callback(server);
    }
  });
});

export default app;
export function listenAsync() {
  return new Promise(resolve => syncDatabase(() => startServer(resolve)));
}

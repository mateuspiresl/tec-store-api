import session from 'express-session';
import connectRedis from 'connect-redis';

import * as redisConfig from '../config/redis';

const RedisStore = connectRedis(session);

export default () => session({
  store: new RedisStore({ host: redisConfig.host }),
  secret: redisConfig.secret,
  saveUninitialized: false,
  resave: false,
});

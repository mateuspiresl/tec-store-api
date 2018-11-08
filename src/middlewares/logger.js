import logger from '../config/logger';

export default () => (req, res, next) => {
  const body = req.method === 'post' || req.method === 'put' ? JSON.stringify(req.body) : '';
  logger.info('%s %s %s', req.method, req.url, body);
  next();
};

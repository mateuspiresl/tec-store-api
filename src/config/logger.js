import winston, { format } from 'winston';

const {
  combine, timestamp, splat, printf,
} = format;

export default winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'verbose.log' }),
  ],
  format: combine(
    timestamp(),
    splat(),
    printf((info) => {
      const date = new Date(info.timestamp);
      const datetime = `${date.toDateString().substr(4)} ${date.toTimeString().substr(0, 8)}`;
      return `${datetime} ${info.level}: ${info.message}`;
    }),
  ),
});

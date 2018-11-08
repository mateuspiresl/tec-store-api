import Sequelize from 'sequelize';
import * as config from './config/database';

export default new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },

  // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
  operatorsAliases: false
});

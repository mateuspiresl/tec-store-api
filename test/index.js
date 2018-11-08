/* global before */

import sequelize from '../src/database';

before(function beforeAll() {
  this.timeout(10000);
  return sequelize.sync({ force: true }); // logging: console.log
});

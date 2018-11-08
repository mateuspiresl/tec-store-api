/* eslint import/prefer-default-export: "off" */
/* global before */

import sequelize from '../src/database';

before(function beforeAll() {
  this.timeout(10000);
  return sequelize.sync({ force: true }); // logging: console.log
});

export function expectStatus(code) {
  return (response) => {
    if (response.statusCode === code) {
      return response;
    }

    throw new Error(`Expected status code ${code} but got ${response.statusCode}.`);
  };
}

/* global describe, it, before, after, afterEach */
/* eslint no-unused-expressions: "off" */

import { expect } from 'chai';
import request from 'supertest';
import app, { listenAsync } from '../src/app';

describe('App', () => {
  it('should start the server', async () => {
    const server = await listenAsync();
    expect(server).to.be.an('object');
    await server.close();
  });

  it('should get the test end-point', async () => {
    await request(app)
      .get('/api')
      .send()
      .expect(200);
  });
});

/* global describe, it */
/* eslint no-unused-expressions: "off" */

import { expect } from 'chai';
import request from 'supertest';

import app from '../../src/app';
import { codes } from '../../src/errors';
import { expectStatus } from '../index';

const register = data => request(app).post('/api/auth/register').send(data);
const check = cookies => request(app).get('/api/auth').set('Cookie', cookies).send();
const login = data => request(app).post('/api/auth').send({ ...data, name: undefined });
const logout = cookies => request(app).delete('/api/auth').set('Cookie', cookies).send();

const DATA = { name: 'Test Name', password: 'password' };
const createData = data => ({ ...DATA, username: Math.random().toString(), ...data });

describe('Controllers | Auth', () => {
  describe('Register', () => {
    it('should register and get loged in automatically', async () => {
      const data = createData();
      const { body, headers } = await register(data).then(expectStatus(codes.successful.OK));

      expect(body.name).to.equal(data.name);
      expect(body.username).to.equal(data.username);

      await check(headers['set-cookie']).then(expectStatus(codes.successful.OK));
    });

    it('should not register with mising fields', async () => {
      const data = createData();

      await register({ ...data, name: undefined })
        .then(expectStatus(codes.client.UNPROCESSABLE_ENTITY));

      await register({ ...data, username: undefined })
        .then(expectStatus(codes.client.UNPROCESSABLE_ENTITY));

      await register({ ...data, password: undefined })
        .then(expectStatus(codes.client.UNPROCESSABLE_ENTITY));
    });

    it('should not register multiple users with the same username', async () => {
      const data = createData();

      await register(data).then(expectStatus(codes.successful.OK));
      await register({ ...data, name: 'Second User' })
        .then(expectStatus(codes.client.UNPROCESSABLE_ENTITY));
    });
  });

  describe('Login', () => {
    it('should login', async () => {
      const data = { name: 'Test Name', username: 'test_name', password: 'password' };
      await register(data);

      const { body, headers } = await login(data).then(expectStatus(codes.successful.OK));
      expect(body.name).to.equal(data.name);
      expect(body.username).to.equal(data.username);

      await check(headers['set-cookie']).then(expectStatus(codes.successful.OK));
    });

    it('should not login with invalid credencials', async () => {
      const data = { username: Math.random().toString(), password: 'password' };
      await login(data).then(expectStatus(codes.client.UNAUTHORIZED));
    });
  });

  describe('Logout', () => {
    it('should invalidate session', async () => {
      const data = createData();
      const { headers } = await register(data);

      await logout(headers['set-cookie']).then(expectStatus(codes.successful.OK));
      await check(headers['set-cookie']).then(expectStatus(codes.client.UNAUTHORIZED));
    });

    it('should respond status OK for non existent session', async () => {
      const data = createData();
      const { headers } = await register(data);

      await logout(headers['set-cookie']);
      await logout(headers['set-cookie']).then(expectStatus(codes.successful.OK));
    });
  });
});

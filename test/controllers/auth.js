/* global describe, it */
/* eslint no-unused-expressions: "off" */

import { expect } from 'chai';
import request from 'supertest';

import app from '../../src/app';
import { codes } from '../../src/errors';
import '../index';

const register = data => request(app).post('/api/auth/register').send(data);
const check = cookies => console.log('cookies', cookies) || request(app).get('/api/auth').set('Cookie', cookies).send();
const login = data => request(app).post('/api/auth').send({ ...data, name: undefined });
const logout = cookies => console.log('cookies', cookies) || request(app).delete('/api/auth').set('Cookie', cookies).send();

describe('Controllers | Auth', () => {
  describe('Register', () => {
    it('should register and get loged in automatically', async () => {
      const data = { name: 'Test Name', username: 'test_name', password: 'password' };
      const { body, headers } = await register(data).expect(codes.successful.OK);

      expect(body.name).to.equal(data.name);
      expect(body.username).to.equal(data.username);

      await check(headers['set-cookie']).expect(codes.successful.OK);
    });

    it('should not register with mising fields', async () => {
      await register({ username: 'test_name', password: 'password' })
        .expect(codes.client.UNPROCESSABLE_ENTITY);

      await register({ name: 'Test Name', password: 'password' })
        .expect(codes.client.UNPROCESSABLE_ENTITY);

      await register({ name: 'Test Name', username: 'test_name' })
        .expect(codes.client.UNPROCESSABLE_ENTITY);
    });
  });

  describe('Login', () => {
    it('should login', async () => {
      const data = { name: 'Test Name', username: 'test_name', password: 'password' };
      await register(data);

      const { body, headers } = await login(data).expect(codes.successful.OK);
      expect(body.name).to.equal(data.name);
      expect(body.username).to.equal(data.username);

      await check(headers['set-cookie']).expect(codes.successful.OK);
    });

    it('should not login with invalid credencials', async () => {
      const data = { username: Math.random().toString(), password: 'password' };
      await login(data).expect(codes.client.UNAUTHORIZED);
    });
  });

  describe('Logout', () => {
    it('should invalidate session', async () => {
      const data = { name: 'Test Name', username: 'test_name', password: 'password' };
      const { headers } = await register(data);

      console.log('headers', headers);

      await logout(headers['set-cookie']).expect(codes.successful.OK);
      await check(headers['set-cookie']).expect(codes.client.UNAUTHORIZED);
    });

    it('should respond status OK for non existent session', async () => {
      const data = { name: 'Test Name', username: 'test_name', password: 'password' };
      const { headers } = await register(data);

      await logout(headers['set-cookie']);
      await logout(headers['set-cookie']).expect(codes.successful.OK);
    });
  });
});

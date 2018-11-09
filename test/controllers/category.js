/* global describe, it, before, afterEach */
/* eslint no-unused-expressions: "off", no-await-in-loop: "off" */

import { expect } from 'chai';
import request from 'supertest';

import app from '../../src/app';
import { codes } from '../../src/errors';
import User, { roles } from '../../src/models/user';
import Category from '../../src/models/category';
import { random, expectStatus } from '../index';

const ROUTE = '/api/category';
const login = data => request(app).post('/api/auth').send({ ...data, name: undefined });
const erase = () => Category.destroy({ where: {} });
const createData = name => ({ name: name || random() });

describe('Controllers | Category', () => {
  let cookies = null;
  const create = data => request(app).post(ROUTE).set('Cookie', cookies).send(data);
  const findAll = () => request(app).get(ROUTE).set('Cookie', cookies).send();
  const update = (id, data) => request(app).put(`${ROUTE}/${id}`).set('Cookie', cookies).send(data);
  const remove = id => request(app).delete(`${ROUTE}/${id}`).set('Cookie', cookies).send();

  before(erase);
  afterEach(erase);

  before(async () => {
    const user = {
      name: 'n',
      username: random(),
      password: 'p',
      role: roles.admin,
    };

    await User.create(user);
    const { headers } = await login(user);
    cookies = headers['set-cookie'];
  });

  describe('Create', () => {
    it('should create a category', async () => {
      const data = createData();
      const { body: { category } } = await create(data).then(expectStatus(codes.successful.OK));

      expect(category.id).to.be.a('number');
      expect(category.name).to.equal(data.name);
    });

    it('should not create with missing fields', async () => {
      await create({}).then(expectStatus(codes.client.UNPROCESSABLE_ENTITY));
    });
  });

  describe('Get all', () => {
    const filter = item => ({ id: item.id, name: item.name });

    it('should get all the categories', async () => {
      const created = [];
      for (let i = 0; i < 10; i += 1) {
        const category = await Category.create(createData());
        created.push(filter(category));
      }

      const { body } = await findAll().then(expectStatus(codes.successful.OK));
      expect(body.categories).to.be.an('array').of.length(10);
      expect(body.categories.map(filter)).to.have.deep.members(created);
    });

    it('should get empty when there is no categories', async () => {
      const { body } = await findAll().then(expectStatus(codes.successful.OK));
      expect(body.categories).to.be.an('array').of.length(0);
    });
  });

  describe('Update', () => {
    it('should update a category', async () => {
      const old = await Category.create(createData());
      const newData = createData();
      const { body } = await update(old.id, newData).then(expectStatus(codes.successful.OK));

      expect(body.category.id).to.equal(old.id);
      expect(body.category.name).to.equal(newData.name);
    });

    it('should receive not found if the category does not exist', async () => {
      await update(1, createData()).then(expectStatus(codes.client.NOT_FOUND));
    });

    it('should receive unprocessable if update to existent name', async () => {
      const toUpdate = await Category.create(createData());
      const existent = await Category.create(createData());

      await update(toUpdate.id, createData(existent.name))
        .then(expectStatus(codes.client.UNPROCESSABLE_ENTITY));
    });
  });

  describe('Delete', () => {
    it('should delete a category', async () => {
      const category = await Category.create(createData());
      await remove(category.id).then(expectStatus(codes.successful.OK));

      const found = await Category.findOne({ id: category.id });
      expect(found).to.equal(null);
    });

    it('should receive 404 if the category does not exist', async () => {
      await remove(1).then(expectStatus(codes.client.NOT_FOUND));
    });
  });
});

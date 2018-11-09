/* global describe, it, before, afterEach */
/* eslint no-unused-expressions: "off", no-await-in-loop: "off" */

import { expect } from 'chai';
import request from 'supertest';

import app from '../../src/app';
import { codes } from '../../src/errors';
import User, { roles } from '../../src/models/user';
import Product from '../../src/models/product';
import Category from '../../src/models/category';
import { random, expectStatus } from '../index';

const ROUTE = '/api/product';
const login = data => request(app).post('/api/auth').send({ ...data, name: undefined });
const erase = () => Product.destroy({ where: {} });
const createData = (categoryId, data) => ({
  name: random(),
  price: ((Math.random() * 0.9 + 0.1) * 100).toString().substr(0, 5),
  categoryId,
  ...data,
});

describe('Controllers | Product', () => {
  let cookies = null;
  let categories = null;

  const setCategoryId = categoryId => (categoryId ? `categoryId=${categoryId}&` : '');
  const setPage = page => (page ? `page=${page}&` : '');
  const setSize = size => (size ? `size=${size}` : '');
  const createFindRoute = (category, page, size) => (
    category || page || size ? `${ROUTE}?${setCategoryId(category)}${setPage(page)}${setSize(size)}` : ROUTE
  );

  const create = data => request(app).post(ROUTE).set('Cookie', cookies).send(data);
  const findByCategory = (category, page, size) => (
    request(app).get(createFindRoute(category, page, size)).set('Cookie', cookies).send()
  );
  const find = (page, size) => findByCategory(null, page, size);
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

    categories = await Promise.all(['A', 'B', 'C'].map(
      name => Category.create({ name }),
    ));
  });

  describe('Create', () => {
    it('should create a product', async () => {
      const data = createData(categories[0].id);
      const { body } = await create(data).then(expectStatus(codes.successful.OK));

      expect(body.product.id).to.be.a('number');
      expect(body.product.name).to.equal(data.name);
      expect(body.product.price).to.equal(data.price);
      expect(body.product.category.id).to.equal(data.categoryId);
    });

    it('should not create with missing fields', async () => {
      await create(createData(categories[0].id, { name: undefined }))
        .then(expectStatus(codes.client.UNPROCESSABLE_ENTITY));

      await create(createData(categories[0].id, { price: undefined }))
        .then(expectStatus(codes.client.UNPROCESSABLE_ENTITY));

      await create(createData(undefined))
        .then(expectStatus(codes.client.UNPROCESSABLE_ENTITY));
    });
  });

  describe('Get all', () => {
    function filter({
      id, name, price, categoryId,
    }) {
      return {
        id, name, price, categoryId,
      };
    }

    async function populate(n = 10) {
      const created = [];

      for (let i = 0; i < n; i += 1) {
        const product = await Product.create(createData(categories[i % 3].id));
        created.push(filter(product.toJSON()));
      }

      return created;
    }

    it('should get all the products', async () => {
      const created = await populate();
      const { body } = await find().then(expectStatus(codes.successful.OK));
      const products = body.products.map(item => filter({
        ...item,
        categoryId: item.category.id,
      }));

      expect(body.page).to.equal(1);
      expect(body.total).to.equal(1);
      expect(products).to.be.an('array').of.length(10);
      expect(products).to.have.deep.members(created);
    });

    it('should get the second page with enough products', async () => {
      await populate();

      const { body } = await find(2, 5).then(expectStatus(codes.successful.OK));
      const products = body.products.map(item => filter({
        ...item,
        categoryId: item.category.id,
      }));

      expect(body.page).to.equal(2);
      expect(body.total).to.equal(2);
      expect(products).to.be.an('array').of.length(5);
    });

    it('should get empty when there is no products', async () => {
      const { body } = await find().then(expectStatus(codes.successful.OK));
      expect(body.page).to.equal(1);
      expect(body.total).to.equal(0);
      expect(body.products).to.be.an('array').of.length(0);
    });

    it('should get empty when page is too outside boundaries', async () => {
      await populate();

      const { body } = await find(10, 100).then(expectStatus(codes.successful.OK));
      expect(body.page).to.equal(10);
      expect(body.total).to.equal(1);
      expect(body.products).to.be.an('array').of.length(0);
    });

    it('should filter by category', async () => {
      const created = await populate(18);
      const categoryId = categories[0].id;
      const { body } = await findByCategory(categoryId)
        .then(expectStatus(codes.successful.OK));

      const products = body.products.map(item => filter({
        ...item,
        categoryId: item.category.id,
      }));

      expect(body.page).to.equal(1);
      expect(body.total).to.equal(1);
      expect(products).to.be.an('array').of.length(6);
      expect(products).to.have.deep.members(created.filter(item => item.categoryId === categoryId));
    });

    it('should filter by category and paginate across the result', async () => {
      await populate(18);

      const { body } = await findByCategory(categories[1].id, 2, 3)
        .then(expectStatus(codes.successful.OK));

      const products = body.products.map(item => filter({
        ...item,
        categoryId: item.category.id,
      }));

      expect(body.page).to.equal(2);
      expect(body.total).to.equal(2);
      expect(products).to.be.an('array').of.length(3);
    });
  });

  describe('Update', () => {
    it('should update a product', async () => {
      const old = await Product.create(createData(categories[0].id));
      const newData = createData(categories[1].id);
      const { body } = await update(old.id, newData).then(expectStatus(codes.successful.OK));

      expect(body.product.id).to.equal(old.id);
      expect(body.product.name).to.equal(newData.name);
      expect(body.product.price).to.equal(newData.price);
      expect(body.product.category.id).to.equal(newData.categoryId);
    });

    it('should receive not found if the product does not exist', async () => {
      await update(1, createData(categories[0].id)).then(expectStatus(codes.client.NOT_FOUND));
    });

    it('should receive unprocessable if update to existent name', async () => {
      const toUpdate = await Product.create(createData(categories[0].id));
      const existent = await Product.create(createData(categories[1].id));

      await update(toUpdate.id, createData(existent.name))
        .then(expectStatus(codes.client.UNPROCESSABLE_ENTITY));
    });
  });

  describe('Delete', () => {
    it('should delete a product', async () => {
      const product = await Product.create(createData(categories[0].id));
      await remove(product.id).then(expectStatus(codes.successful.OK));

      const found = await Product.findOne({ id: product.id });
      expect(found).to.equal(null);
    });

    it('should receive 404 if the product does not exist', async () => {
      await remove(1).then(expectStatus(codes.client.NOT_FOUND));
    });
  });
});

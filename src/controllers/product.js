import { Router } from 'express';
import Sequelize from 'sequelize';

import Product from '../models/product';
import Category from '../models/category';
import authenticate from '../middlewares/authenticate';
import {
  ApiError,
  ModelError,
  codes,
  createError,
  common,
} from '../errors';

/**
 * @apiDefine ProductNotFoundError
 * @apiVersion 0.0.0
 * @apiError (401) ProductNotFoundError The product was not found.
 */
const productNotFoundError = createError('ProductNotFoundError', 'The product was not found.',
  codes.client.NOT_FOUND);

const PAGE_SIZE = 12;

/**
 * Finds the category and parse the data.
 * It can't find, throws error.
 * @param {Number} id ID of the category.
 */
async function findCategory(id) {
  const category = await Category.findOne({
    where: { id },
  });

  if (!category) {
    throw new ModelError(common.validationError, null, 'Invalid category ID.');
  }

  return { id: category.id, name: category.name };
}

export default Router()

  .use(authenticate(['admin']))

  /**
   * @api {post} /product Create product
   * @apiGroup Product
   * @apiVersion 0.0.0
   * @apiDescription Creates a product.
   *
   * @apiParam {String} name Name.
   * @apiParam {Number} price Price.
   * @apiParam {Number} categoryId ID of the category.
   *
   * @apiSuccess (200) {Object} product The product.
   * @apiSuccess (200) {Number} product.id ID.
   * @apiSuccess (200) {String} product.name Name.
   * @apiSuccess (200) {Number} product.price Price.
   * @apiSuccess (200) {Object} product.category The category.
   * @apiSuccess (200) {Number} product.category.id ID of the category.
   * @apiSuccess (200) {String} product.category.name Name of the category.
   * @apiSuccess (200) {String} product.createdAt Date of creation.
   * @apiSuccess (200) {String} product.updatedAt Date of the last update.
   *
   * @apiUse ValidationError
   */
  .post('/', async (req, res) => {
    const category = await findCategory(req.body.categoryId);
    const product = await Product.create(req.body)
      .catch(Sequelize.ValidationError, (error) => {
        throw new ModelError(common.validationError, null, error);
      });

    res.json({
      product: {
        ...product.toJSON(),
        category,
      },
    });
  })

  /**
   * @apiGroup Product
   * @api {get} /product/:id Get products
   * @apiVersion 0.0.0
   * @apiDescription Finds all products.
   *
   * @apiParam {Number} [page] Page number.
   * @apiParam {Number} [size] Number of products per page.
   * @apiParam {Number} [categoryId] ID of the category to filter by.
   *
   * @apiSuccess (200) {Number} page Page number.
   * @apiSuccess (200) {Number} total Total number of pages.
   * @apiSuccess (200) {Object[]} products The products.
   * @apiSuccess (200) {Number} product.id ID.
   * @apiSuccess (200) {String} product.name Name.
   * @apiSuccess (200) {Number} product.price Price.
   * @apiSuccess (200) {Object} product.category The category.
   * @apiSuccess (200) {Number} product.category.id ID of the category.
   * @apiSuccess (200) {String} product.category.name Name of the category.
   * @apiSuccess (200) {String} product.createdAt Date of creation.
   * @apiSuccess (200) {String} product.updatedAt Date of the last update.
   */
  .get('/', async (req, res) => {
    const { page: pageArg, size: sizeArg, categoryId } = req.query;
    // Page and size should be greater than 1
    const page = isNaN(pageArg) || pageArg <= 0 ? 1 : parseInt(pageArg, 10);
    const size = isNaN(sizeArg) || sizeArg <= 0 ? PAGE_SIZE : parseInt(sizeArg, 10);

    const [categories, { count, rows }] = await Promise.all([
      // Fetch categories and create a map of name -> { id, name }
      Category.findAll().then(categoriesList => (
        categoriesList.reduce((map, current) => ({
          ...map,
          [current.id]: { id: current.id, name: current.name },
        }), {})
      )),
      // Fetch tha products considering the pagination
      Product.findAndCountAll({
        where: categoryId && { categoryId },
        limit: size,
        offset: size * (page - 1),
      }),
    ]);

    res.json({
      page,
      total: Math.ceil(count / size),
      products: rows.map(item => ({
        ...item.toJSON(),
        categoryId: undefined,
        category: categories[item.categoryId],
      })),
    });
  })

  /**
   * @api {put} /product Update product
   * @apiGroup Product
   * @apiVersion 0.0.0
   * @apiDescription Updates a product.
   *
   * @apiParam {String} [name] Name.
   * @apiParam {Number} [price] Price.
   * @apiParam {Number} [categoryId] ID of the category.
   *
   * @apiSuccess (200) {Object[]} products The products.
   * @apiSuccess (200) {Number} product.id ID.
   * @apiSuccess (200) {String} product.name Name.
   * @apiSuccess (200) {Number} product.price Price.
   * @apiSuccess (200) {Object} product.category The category.
   * @apiSuccess (200) {Number} product.category.id ID of the category.
   * @apiSuccess (200) {String} product.category.name Name of the category.
   * @apiSuccess (200) {String} product.createdAt Date of creation.
   * @apiSuccess (200) {String} product.updatedAt Date of the last update.
   *
   * @apiUse ProductNotFoundError
   * @apiUse ValidationError
   */
  .put('/:id', async (req, res) => {
    const product = await Product.findOne({
      where: { id: req.params.id },
    });

    if (!product) {
      throw new ApiError(productNotFoundError);
    }

    // Fetch the category
    // The #findCategory ensures it exists
    const categoryId = req.body.categoryId || product.categoryId;
    const category = await findCategory(categoryId);

    // Update values
    const { name, price } = req.body;
    product.set({ name, price, categoryId });

    await product.save().catch(Sequelize.ValidationError, (error) => {
      throw new ModelError(common.validationError, null, error);
    });

    await product.reload();

    res.json({
      product: {
        ...product.toJSON(),
        category,
      },
    });
  })

  /**
   * @api {delete} /product Delete product
   * @apiGroup Product
   * @apiVersion 0.0.0
   * @apiDescription Deletes a product.
   *
   * @apiUse ProductNotFoundError
   */
  .delete('/:id', async (req, res) => {
    const deleted = await Product.destroy({
      where: { id: req.params.id },
    });

    if (deleted === 0) {
      throw new ApiError(productNotFoundError);
    }

    res.end();
  });

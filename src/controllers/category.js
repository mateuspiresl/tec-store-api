import { Router } from 'express';
import Sequelize from 'sequelize';

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
 * @apiDefine CategoryNotFoundError
 * @apiVersion 0.0.0
 * @apiError (401) CategoryNotFoundError The category was not found.
 */
const categoryNotFoundError = createError('CategoryNotFoundError', 'The category was not found.',
  codes.client.NOT_FOUND);

export default Router()

  .use(authenticate(['admin']))

  /**
   * @api {post} /category Create category
   * @apiGroup Category
   * @apiVersion 0.0.0
   * @apiDescription Creates a category.
   *
   * @apiParam {String} name Name.
   *
   * @apiSuccess (200) {Object} category The category.
   * @apiSuccess (200) {Number} id ID.
   * @apiSuccess (200) {String} name Name.
   * @apiSuccess (200) {String} createdAt Date of creation.
   * @apiSuccess (200) {String} updatedAt Date of the last update.
   *
   * @apiUse ValidationError
   */
  .post('/', async (req, res) => {
    const category = await Category.create(req.body)
      .catch(Sequelize.ValidationError, (error) => {
        throw new ModelError(common.validationError, null, error);
      });

    res.json({ category: category.toJSON() });
  })

  /**
   * @apiGroup Category
   * @api {get} /category/:id Get categories
   * @apiVersion 0.0.0
   * @apiDescription Finds all categories.
   *
   * @apiSuccess (200) {Object[]} categories The categories.
   * @apiSuccess (200) {Number} id The id.
   * @apiSuccess (200) {String} name The name.
   * @apiSuccess (200) {String} createdAt The date of creation.
   * @apiSuccess (200) {String} updatedAt The date of the last update.
   */
  .get('/', async (req, res) => {
    const categories = await Category.findAll();
    res.json({ categories: categories.map(item => item.toJSON()) });
  })

  /**
   * @api {put} /category Update category
   * @apiGroup Category
   * @apiVersion 0.0.0
   * @apiDescription Updates a category.
   *
   * @apiParam {String} name Name.
   *
   * @apiSuccess (200) {Object} category The category.
   * @apiSuccess (200) {Number} id ID.
   * @apiSuccess (200) {String} name Name.
   * @apiSuccess (200) {String} createdAt Date of creation.
   * @apiSuccess (200) {String} updatedAt Date of the last update.
   *
   * @apiUse CategoryNotFoundError
   */
  .put('/:id', async (req, res) => {
    const category = await Category.findOne({ id: req.params.id });

    if (!category) {
      throw new ApiError(categoryNotFoundError);
    }

    category.set('name', req.body.name);

    const updated = await category.save()
      .catch(Sequelize.ValidationError, (error) => {
        throw new ModelError(common.validationError, null, error);
      });

    res.json({ category: updated.toJSON() });
  })

  /**
   * @api {delete} /category Delete category
   * @apiGroup Category
   * @apiVersion 0.0.0
   * @apiDescription Deletes a category.
   *
   * @apiUse CategoryNotFoundError
   */
  .delete('/:id', async (req, res) => {
    const deleted = await Category.destroy({
      where: { id: req.params.id },
    });

    if (deleted === 0) {
      throw new ApiError(categoryNotFoundError);
    }

    res.end();
  });

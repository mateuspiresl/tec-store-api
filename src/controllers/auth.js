import { Router } from 'express';
import Sequelize from 'sequelize';

import logger from '../config/logger';
import User, { validatePassword } from '../models/user';
import {
  ApiError,
  ModelError,
  codes,
  createError,
} from '../errors';

/**
 * @apiDefine ValidationError
 * @apiVersion 0.0.0
 * @apiError (422) ValidationError Invalid data received.
 */
const validationError = createError('ValidationError', 'Invalid data received.',
  codes.client.UNPROCESSABLE_ENTITY);

/**
 * @apiDefine AuthenticationError
 * @apiVersion 0.0.0
 * @apiError (401) AuthenticationError Username does not exist or password didn't match.
 */
const authenticationError = createError('AuthenticationError',
  'Username does not exist or password didn\'t match.', codes.client.UNAUTHORIZED);

/**
 * @apiDefine NotAuthenticatedError
 * @apiVersion 0.0.0
 * @apiError (401) NotAuthenticatedError Not authenticated.
 */
const notAuthenticatedError = createError('NotAuthenticatedError', 'Not authenticated.',
  codes.client.UNAUTHORIZED);

function parseUser(user) {
  return { ...user.toJSON(), password: undefined };
}

function createSession(user) {
  return { id: user.id, role: user.role };
}

export default Router()

  /**
   * @api {post} /auth/register Register
   * @apiGroup Auth
   * @apiVersion 0.0.0
   * @apiDescription Register.
   *
   * @apiParam {String} name Name.
   * @apiParam {String} username Username.
   * @apiParam {String} password Password.
   *
   * @apiSuccess (200) {String} id ID.
   * @apiSuccess (200) {String} name Name.
   * @apiSuccess (200) {String} username Username.
   *
   * @apiUse ValidationError
   */
  .post('/register', async (req, res) => {
    const user = await User.create(req.body)
      .catch(Sequelize.ValidationError, () => {
        throw new ModelError(validationError);
      });

    req.session.user = createSession(user);
    res.json(parseUser(user));
  })

  /**
   * @api {post} /auth Login
   * @apiGroup Auth
   * @apiVersion 0.0.0
   * @apiDescription Login.
   *
   * @apiParam {String} username Username.
   * @apiParam {String} password Password.
   *
   * @apiSuccess (200) {String} id ID.
   * @apiSuccess (200) {String} name Name.
   * @apiSuccess (200) {String} username Username.
   *
   * @apiUse AuthenticationError
   */
  .post('/', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({
      where: { username },
    });

    if (user && validatePassword(user, password)) {
      req.session.user = createSession(user);
      res.json(parseUser(user));
    } else {
      throw new ApiError(authenticationError);
    }
  })

  /**
   * @api {get} /auth Check
   * @apiGroup Auth
   * @apiVersion 0.0.0
   * @apiDescription Check authentication.
   *
   * @apiUser NotAuthenticatedError
   */
  .get('/', async (req, res) => {
    if (req.session.user && req.session.user.id) {
      res.end();
    } else {
      throw new ApiError(notAuthenticatedError);
    }
  })

  /**
   * @api {delete} /auth Logout
   * @apiGroup Auth
   * @apiVersion 0.0.0
   * @apiDescription Logout.
   */
  .delete('/', async (req, res) => {
    req.session.destroy((error) => {
      if (error) {
        logger.error('DELETE /auth error', error);
        req.session.user = null;
      }

      res.end();
    });
  });

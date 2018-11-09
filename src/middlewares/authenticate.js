import { roles } from '../models/user';
import { ApiError, codes, createError } from '../errors';

/**
 * @apiDefine UnauthorizedError
 * @apiVersion 0.0.0
 * @apiError (401) UnauthorizedError Not authenticated.
 */
const unauthorizedError = createError('UnauthorizedError', 'Not authenticated or unauthorized role.',
  codes.client.UNAUTHORIZED);

export default (alloweRoles = Object.keys(roles)) => (req, res, next) => {
  if (req.session.user && alloweRoles.includes(req.session.user.role)) {
    next();
  } else {
    throw new ApiError(unauthorizedError);
  }
};

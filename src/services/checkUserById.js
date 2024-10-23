import createHttpError from 'http-errors';

export const checkUserById = async (req, res, next) => {
  const { user } = req;

  if (!user) {
    next(createHttpError(401, 'Unauthorized'));
  }

  next();
};

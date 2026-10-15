export const notFound = (req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.code === 11000) {
    status = 400;
    message = `${Object.keys(err.keyValue)[0]} already exists`;
  }
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  }
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired, please login again';
  }

  if (status === 500) console.error(err);

  res.status(status).json({ success: false, message });
};
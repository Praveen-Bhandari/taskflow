import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized, token missing' });
  }

  const token = header.split(' ')[1];

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: 'User no longer exists' });
  }

  req.user = user;
  next();
};
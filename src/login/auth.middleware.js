import jwt from 'jsonwebtoken';
import config from '../config.js';
import 'dotenv/config';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'ต้องล็อกอินก่อน' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, config.jwt.secret);
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Token หมดอายุหรือไม่ถูกต้อง' });
  }
}
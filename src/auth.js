import jwt from 'jsonwebtoken';

// Генерация JWT токена
export function generateToken(user) {
  const token = jwt.sign(
    { id: user.id, email: user.email },
    'your_secret_key',
    { expiresIn: '1h' },
  );
  return token;
}

// Middleware для проверки токена
export function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, 'your_secret_key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

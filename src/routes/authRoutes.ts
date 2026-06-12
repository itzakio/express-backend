import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Protected example (any authenticated user)
router.get('/profile', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Admin only example
router.get('/admin', authenticate, authorize(['admin']), (req, res) => {
  res.json({ message: 'Welcome admin' });
});

export default router;
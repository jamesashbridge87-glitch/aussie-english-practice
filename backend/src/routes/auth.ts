import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { UserModel } from '../models/User.js';
import { SubscriptionModel } from '../models/Subscription.js';
import { generateToken } from '../utils/jwt.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const existingUser = UserModel.findByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Create user
    const user = await UserModel.create({ email, password, name });

    // Create free tier subscription
    SubscriptionModel.create({
      user_id: user.id,
      plan: 'free',
      status: 'active',
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { email, password } = validation.data;

    // Find user
    const user = UserModel.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isValid = await UserModel.verifyPassword(user, password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Get user with subscription info
    const userWithSub = UserModel.getWithSubscription(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: userWithSub,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/me
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userWithSub = UserModel.getWithSubscription(req.user!.id);
    if (!userWithSub) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: userWithSub });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// PATCH /auth/me
router.patch('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (name !== undefined) {
      UserModel.updateName(req.user!.id, name);
    }

    const userWithSub = UserModel.getWithSubscription(req.user!.id);
    res.json({ user: userWithSub });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;

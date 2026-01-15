import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initializeDatabase } from './db/database.js';

// Routes
import authRoutes from './routes/auth.js';
import subscriptionRoutes from './routes/subscriptions.js';
import sessionRoutes from './routes/sessions.js';
import billingRoutes from './routes/billing.js';
import voiceRoutes from './routes/voice.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
initializeDatabase();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
});
app.use(limiter);

// Stripe webhook needs raw body
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// Parse JSON for other routes
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/voice', voiceRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   Aussie English Practice Backend                  ║
║   Server running on http://localhost:${PORT}          ║
╚════════════════════════════════════════════════════╝
  `);
});

export default app;

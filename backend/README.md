# Aussie English Practice - Backend

Backend API for the Aussie English Practice app. Handles user authentication, subscription management, usage tracking, and Stripe payments.

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

Copy the example env file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

- `JWT_SECRET` - Generate a strong secret for JWT signing
- `STRIPE_SECRET_KEY` - Your Stripe secret key (from Stripe Dashboard)
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret
- `STRIPE_PRICE_*` - Stripe Price IDs for each plan (create in Stripe Dashboard)
- `FRONTEND_URL` - Your frontend URL (for CORS)

### 3. Create Stripe Products and Prices

In your Stripe Dashboard:

1. Create a Product called "Aussie English Practice"
2. Create three Prices:
   - Basic: $25 AUD/month
   - Standard: $49 AUD/month
   - Premium: $79 AUD/month
3. Copy the Price IDs to your `.env` file

### 4. Initialize the database

```bash
npm run db:migrate
```

### 5. Start the server

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `PATCH /api/auth/me` - Update user profile (requires auth)

### Subscriptions

- `GET /api/subscriptions/plans` - Get available plans
- `GET /api/subscriptions/current` - Get current subscription (requires auth)
- `GET /api/subscriptions/usage` - Get usage history (requires auth)
- `GET /api/subscriptions/check` - Check if user can start session (requires auth)

### Sessions

- `POST /api/sessions/start` - Start practice session (requires auth, checks limits)
- `POST /api/sessions/:id/end` - End practice session (requires auth)
- `GET /api/sessions/active` - Get active session (requires auth)
- `GET /api/sessions/history` - Get session history (requires auth)

### Billing

- `POST /api/billing/checkout` - Create Stripe checkout session (requires auth)
- `POST /api/billing/portal` - Create Stripe billing portal session (requires auth)
- `POST /api/billing/webhook` - Stripe webhook handler

## Plan Limits

| Plan | Daily Minutes | Monthly Price |
|------|--------------|---------------|
| Free | 2 | $0 |
| Basic | 5 | $25 AUD |
| Standard | 10 | $49 AUD |
| Premium | 15 | $79 AUD |

## Database

Uses SQLite for simplicity. Database file is stored in `backend/data/aussie-english.db`.

Tables:
- `users` - User accounts
- `subscriptions` - Active subscriptions
- `usage_records` - Daily usage tracking
- `practice_sessions` - Individual session records
- `plan_limits` - Plan configuration

## Stripe Webhook Events

The backend handles these Stripe webhook events:
- `checkout.session.completed` - New subscription created
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_failed` - Payment failed

To test webhooks locally, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3001/api/billing/webhook
```

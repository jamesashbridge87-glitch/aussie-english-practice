# Aussie English Practice

An interactive web application for practicing Australian English conversation with an AI-powered voice agent.

## Features

- **Voice Conversation Practice** - Real-time voice conversations with an AI tutor using ElevenLabs Conversational AI
- **Three Practice Modes**
  - Everyday English - Common Australian expressions and greetings
  - Aussie Slang - Learn authentic Australian slang
  - Workplace English - Professional communication in Australian workplaces
- **Pronunciation Practice** - Record your speech and get scored on accuracy, clarity, fluency, and Aussie accent
- **Progress Tracking** - Track your sessions, practice time, streaks, and improvement
- **Achievements System** - Earn badges for milestones and consistent practice
- **Audio Visualization** - Real-time waveform display during conversations
- **Export Progress** - Download your progress as JSON, CSV, or PDF
- **Subscription Plans** - Tiered access with daily usage limits
- **User Authentication** - Secure login and account management

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- ElevenLabs React SDK
- Web Speech API (for pronunciation practice)

### Backend
- Node.js / Express
- SQLite (better-sqlite3)
- JWT Authentication
- Stripe for payments
- Zod for validation

## Getting Started

### Prerequisites

- Node.js 18+
- An ElevenLabs account with a Conversational AI agent
- A Stripe account (for subscriptions)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/aussie-english-practice.git
cd aussie-english-practice

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### Configuration

#### Frontend

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3001/api
```

#### Backend

1. Copy the example env file:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   - `JWT_SECRET` - Generate a strong secret
   - `STRIPE_SECRET_KEY` - From Stripe Dashboard
   - `STRIPE_WEBHOOK_SECRET` - From Stripe CLI or Dashboard
   - `STRIPE_PRICE_*` - Create products in Stripe and add Price IDs

3. Initialize the database:
   ```bash
   npm run db:migrate
   ```

### Running the App

#### Development

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

#### Production

```bash
# Build frontend
npm run build

# Build and start backend
cd backend
npm run build
npm start
```

## Project Structure

```
├── src/                          # Frontend source
│   ├── components/
│   │   ├── AussieEnglishPractice.tsx  # Main conversation component
│   │   ├── PracticeModeSelector.tsx    # Mode selection UI
│   │   ├── AudioVisualizer.tsx         # Waveform visualization
│   │   ├── ProgressDashboard.tsx       # Stats and achievements
│   │   ├── PronunciationPractice.tsx   # Speech recognition practice
│   │   ├── AchievementDisplay.tsx      # Achievement badges
│   │   ├── AuthModal.tsx               # Login/Register modal
│   │   ├── UserMenu.tsx                # User dropdown menu
│   │   ├── UsageBadge.tsx              # Usage limit display
│   │   ├── SubscriptionPlans.tsx       # Plan selection
│   │   └── ExportMenu.tsx              # Progress export options
│   ├── hooks/
│   │   ├── useAuth.ts                  # Authentication state
│   │   ├── useSubscription.ts          # Subscription & usage
│   │   ├── useProgressTracking.ts      # Progress state management
│   │   ├── useAchievements.ts          # Achievement logic
│   │   ├── usePronunciationScoring.ts  # Pronunciation scoring
│   │   └── useSpeechRecognition.ts     # Web Speech API wrapper
│   ├── utils/
│   │   └── exportProgress.ts           # Export functionality
│   └── App.tsx
│
├── backend/                      # Backend source
│   ├── src/
│   │   ├── routes/               # API routes
│   │   │   ├── auth.ts           # Authentication endpoints
│   │   │   ├── subscriptions.ts  # Subscription endpoints
│   │   │   ├── sessions.ts       # Session tracking
│   │   │   └── billing.ts        # Stripe integration
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT verification
│   │   │   └── usageLimits.ts    # Usage limit checks
│   │   ├── models/               # Database models
│   │   ├── services/             # Business logic
│   │   ├── db/                   # Database setup
│   │   └── index.ts              # Express server
│   └── package.json
```

## Subscription Plans

| Plan | Daily Limit | Monthly Price |
|------|-------------|---------------|
| Free | 2 minutes | $0 |
| Basic | 5 minutes | $25 AUD |
| Standard | 10 minutes | $49 AUD |
| Premium | 15 minutes | $79 AUD |

## API Documentation

See [backend/README.md](backend/README.md) for full API documentation.

## Browser Support

- Chrome (recommended) - Full support for Web Speech API
- Edge - Full support
- Firefox - Limited speech recognition support
- Safari - Limited speech recognition support

## License

MIT

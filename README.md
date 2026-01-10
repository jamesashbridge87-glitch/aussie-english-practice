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

## Tech Stack

- React 18
- TypeScript
- Vite
- ElevenLabs React SDK
- Web Speech API (for pronunciation practice)

## Getting Started

### Prerequisites

- Node.js 18+
- An ElevenLabs account with a Conversational AI agent

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/aussie-english-practice.git
cd aussie-english-practice

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Configuration

The app is configured to use a specific ElevenLabs agent ID. To use your own agent:

1. Create a Conversational AI agent in [ElevenLabs](https://elevenlabs.io)
2. Update the `agentId` in `src/components/AussieEnglishPractice.tsx`

## Project Structure

```
src/
├── components/
│   ├── AussieEnglishPractice.tsx  # Main conversation component
│   ├── PracticeModeSelector.tsx    # Mode selection UI
│   ├── AudioVisualizer.tsx         # Waveform visualization
│   ├── ProgressDashboard.tsx       # Stats and achievements
│   ├── PronunciationPractice.tsx   # Speech recognition practice
│   ├── AchievementDisplay.tsx      # Achievement badges
│   └── ExportMenu.tsx              # Progress export options
├── hooks/
│   ├── useProgressTracking.ts      # Progress state management
│   ├── useAchievements.ts          # Achievement logic
│   ├── usePronunciationScoring.ts  # Pronunciation scoring
│   └── useSpeechRecognition.ts     # Web Speech API wrapper
├── utils/
│   └── exportProgress.ts           # Export functionality
└── App.tsx
```

## Browser Support

- Chrome (recommended) - Full support for Web Speech API
- Edge - Full support
- Firefox - Limited speech recognition support
- Safari - Limited speech recognition support

## License

MIT

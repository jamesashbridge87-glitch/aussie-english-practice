import { PracticeMode } from '../hooks/useProgressTracking';
import './PracticeModeSelector.css';

interface PracticeModeSelectorProps {
  selectedMode: PracticeMode;
  onSelectMode: (mode: PracticeMode) => void;
  disabled?: boolean;
}

const modeConfig: Record<PracticeMode, { title: string; description: string; icon: string }> = {
  everyday: {
    title: 'Everyday English',
    description: 'Practice casual conversations, greetings, and daily interactions',
    icon: '🏠',
  },
  slang: {
    title: 'Aussie Slang',
    description: 'Learn fair dinkum Australian expressions and colloquialisms',
    icon: '🦘',
  },
  workplace: {
    title: 'Workplace English',
    description: 'Professional communication for Australian work environments',
    icon: '💼',
  },
};

export function PracticeModeSelector({
  selectedMode,
  onSelectMode,
  disabled = false,
}: PracticeModeSelectorProps) {
  return (
    <div className="mode-selector">
      <h3>Choose Your Practice Mode</h3>
      <div className="mode-options">
        {(Object.keys(modeConfig) as PracticeMode[]).map((mode) => {
          const config = modeConfig[mode];
          return (
            <button
              key={mode}
              className={`mode-option ${selectedMode === mode ? 'selected' : ''}`}
              onClick={() => onSelectMode(mode)}
              disabled={disabled}
            >
              <span className="mode-icon">{config.icon}</span>
              <span className="mode-title">{config.title}</span>
              <span className="mode-description">{config.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const modePrompts: Record<PracticeMode, string> = {
  everyday: `You are an Australian English teacher helping students practice everyday conversational English.
Focus on:
- Casual greetings and farewells (G'day, See ya, How ya going?)
- Everyday situations like shopping, asking for directions, ordering food
- Natural Australian pronunciation and rhythm
- Common Australian expressions used in daily life
Keep the conversation friendly and casual, like chatting with a neighbour.`,

  slang: `You are an Australian English teacher specializing in Aussie slang and colloquialisms.
Focus on:
- Classic Australian slang (arvo, servo, bottle-o, maccas, etc.)
- Rhyming slang and abbreviations
- Expressions like "no worries", "she'll be right", "fair dinkum"
- Cultural context behind Australian expressions
- Fun facts about where these expressions come from
Make it fun and engaging - throw in some slang naturally and explain what it means.`,

  workplace: `You are an Australian English teacher helping students prepare for Australian workplaces.
Focus on:
- Professional but friendly Australian communication style
- Email etiquette and meeting language
- How Australians balance professionalism with casualness
- Workplace expressions and appropriate humour
- Cultural norms like "tall poppy syndrome" and egalitarianism
Help them sound professional while fitting into Australian work culture.`,
};

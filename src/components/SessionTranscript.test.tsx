import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent, createMockMessages } from '../test/test-utils';
import { SessionTranscript, TranscriptMessage } from './SessionTranscript';

const mockMessages: TranscriptMessage[] = [
  {
    id: 'msg-1',
    role: 'agent',
    content: "G'day mate! How are you going today?",
    timestamp: new Date('2024-01-15T10:00:00'),
  },
  {
    id: 'msg-2',
    role: 'user',
    content: "I'm doing well, thanks!",
    timestamp: new Date('2024-01-15T10:00:30'),
  },
  {
    id: 'msg-3',
    role: 'agent',
    content: "No worries! Let's have a yarn about your experience.",
    timestamp: new Date('2024-01-15T10:01:00'),
  },
];

// Simple messages without slang for certain tests
const simpleMessages: TranscriptMessage[] = [
  {
    id: 'msg-1',
    role: 'agent',
    content: 'Hello, how are you?',
    timestamp: new Date('2024-01-15T10:00:00'),
  },
  {
    id: 'msg-2',
    role: 'user',
    content: 'I am fine, thanks!',
    timestamp: new Date('2024-01-15T10:00:30'),
  },
];

describe('SessionTranscript', () => {
  // Setup clipboard spy before each test
  let clipboardSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
  });

  it('renders empty state when no messages', () => {
    render(
      <SessionTranscript
        messages={[]}
        agentName="Sarah"
      />
    );

    expect(screen.getByText('Start speaking to begin the conversation')).toBeInTheDocument();
    expect(screen.getByText('Your conversation will appear here in real-time')).toBeInTheDocument();
  });

  it('renders messages correctly', () => {
    render(
      <SessionTranscript
        messages={simpleMessages}
        agentName="Sarah"
        highlightSlang={false}
      />
    );

    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText('I am fine, thanks!')).toBeInTheDocument();
  });

  it('displays correct sender names', () => {
    render(
      <SessionTranscript
        messages={mockMessages}
        agentName="Sarah"
        userName="James"
      />
    );

    const sarahLabels = screen.getAllByText('Sarah');
    const jamesLabels = screen.getAllByText('James');

    expect(sarahLabels.length).toBe(2); // Two agent messages
    expect(jamesLabels.length).toBe(1); // One user message
  });

  it('shows message count in header', () => {
    render(
      <SessionTranscript
        messages={mockMessages}
        agentName="Sarah"
      />
    );

    expect(screen.getByText('3 messages')).toBeInTheDocument();
  });

  it('highlights Aussie slang when enabled', () => {
    render(
      <SessionTranscript
        messages={mockMessages}
        agentName="Sarah"
        highlightSlang={true}
      />
    );

    // Check that slang terms are highlighted
    const slangHighlights = document.querySelectorAll('.slang-highlight');
    expect(slangHighlights.length).toBeGreaterThan(0);

    // Check specific slang terms
    const gdayHighlight = screen.getByText("G'day");
    expect(gdayHighlight).toHaveClass('slang-highlight');

    const mateHighlight = screen.getByText('mate');
    expect(mateHighlight).toHaveClass('slang-highlight');
  });

  it('does not highlight slang when disabled', () => {
    render(
      <SessionTranscript
        messages={mockMessages}
        agentName="Sarah"
        highlightSlang={false}
      />
    );

    const slangHighlights = document.querySelectorAll('.slang-highlight');
    expect(slangHighlights.length).toBe(0);
  });

  it('shows connected status when connected', () => {
    render(
      <SessionTranscript
        messages={mockMessages}
        agentName="Sarah"
        isConnected={true}
        isSpeaking={false}
        isListening={false}
      />
    );

    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('shows speaking status when agent is speaking', () => {
    render(
      <SessionTranscript
        messages={mockMessages}
        agentName="Sarah"
        isSpeaking={true}
      />
    );

    expect(screen.getByText('Sarah is speaking...')).toBeInTheDocument();
  });

  it('shows listening status when listening', () => {
    render(
      <SessionTranscript
        messages={mockMessages}
        agentName="Sarah"
        isListening={true}
      />
    );

    expect(screen.getByText('Listening to you...')).toBeInTheDocument();
  });

  it('shows disconnected status when not connected', () => {
    render(
      <SessionTranscript
        messages={mockMessages}
        agentName="Sarah"
        isConnected={false}
      />
    );

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('can collapse and expand transcript', async () => {
    const user = userEvent.setup();

    render(
      <SessionTranscript
        messages={simpleMessages}
        agentName="Sarah"
        highlightSlang={false}
      />
    );

    // Find collapse button
    const collapseButton = screen.getByTitle('Collapse');

    // Initially messages should be visible
    expect(screen.getByText('Hello, how are you?')).toBeVisible();

    // Click to collapse
    await user.click(collapseButton);

    // After collapse, the transcript container should have collapsed class
    const transcript = document.querySelector('.session-transcript');
    expect(transcript).toHaveClass('collapsed');
  });

  it('copies message to clipboard on click', async () => {
    const user = userEvent.setup();

    render(
      <SessionTranscript
        messages={simpleMessages}
        agentName="Sarah"
        highlightSlang={false}
      />
    );

    // Find first message's copy button
    const copyButtons = document.querySelectorAll('.message-copy-btn');
    expect(copyButtons.length).toBeGreaterThan(0);

    // Hover over message to reveal copy button
    const firstMessage = document.querySelector('.transcript-message');
    await user.hover(firstMessage!);

    // Click the copy button
    await user.click(copyButtons[0]);

    // Verify clipboard.writeText was called
    expect(clipboardSpy).toHaveBeenCalled();
  });

  it('copies full transcript on button click', async () => {
    const user = userEvent.setup();
    const onCopyTranscript = vi.fn();

    render(
      <SessionTranscript
        messages={simpleMessages}
        agentName="Sarah"
        onCopyTranscript={onCopyTranscript}
        highlightSlang={false}
      />
    );

    // Find the copy full transcript button
    const copyTranscriptButton = screen.getByTitle('Copy full transcript');
    await user.click(copyTranscriptButton);

    expect(clipboardSpy).toHaveBeenCalled();
    expect(onCopyTranscript).toHaveBeenCalled();
  });

  it('displays typing indicator when agent is speaking', () => {
    render(
      <SessionTranscript
        messages={mockMessages}
        agentName="Sarah"
        isSpeaking={true}
      />
    );

    const typingIndicator = document.querySelector('.typing-indicator');
    expect(typingIndicator).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    render(
      <SessionTranscript
        messages={mockMessages}
        agentName="Sarah"
      />
    );

    // Check that timestamps are displayed (format may vary by locale)
    const timeElements = document.querySelectorAll('.message-time');
    expect(timeElements.length).toBe(mockMessages.length);
  });

  it('applies correct styles for user vs agent messages', () => {
    render(
      <SessionTranscript
        messages={mockMessages}
        agentName="Sarah"
      />
    );

    const agentMessages = document.querySelectorAll('.transcript-message.agent');
    const userMessages = document.querySelectorAll('.transcript-message.user');

    expect(agentMessages.length).toBe(2);
    expect(userMessages.length).toBe(1);
  });

  it('uses helper to create mock messages', () => {
    const messages = createMockMessages(6);

    render(
      <SessionTranscript
        messages={messages}
        agentName="Sarah"
      />
    );

    expect(screen.getByText('6 messages')).toBeInTheDocument();
  });
});

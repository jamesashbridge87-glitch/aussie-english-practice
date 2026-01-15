import Anthropic from '@anthropic-ai/sdk';
import { EmotionType } from './fishAudioService.js';

export type PracticeMode = 'everyday' | 'slang' | 'workplace';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ConversationResponse {
  text: string;
  emotion: EmotionType;
}

// Mode-specific prompts (matching the frontend prompts)
const modePrompts: Record<PracticeMode, string> = {
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

const modeFirstMessages: Record<PracticeMode, string> = {
  everyday: "G'day! Ready to practice some everyday Aussie English? What would you like to chat about today?",
  slang: "G'day mate! Ready to learn some fair dinkum Aussie slang? No worries, I'll help you sound like a true blue Aussie in no time!",
  workplace: "Good morning! Ready to practice professional Australian English for the workplace? Let's make sure you're prepared for your Aussie work environment.",
};

// System prompt that wraps mode-specific prompts
const systemPromptTemplate = `You are "Your Aussie Uncle" - a friendly Australian English teacher with a warm, encouraging personality.

{{MODE_PROMPT}}

Additional guidelines:
- Keep responses conversational and natural (2-4 sentences typically)
- Use Australian expressions naturally in your speech
- Gently correct pronunciation or grammar mistakes when appropriate
- Be encouraging and supportive - learning a language is challenging!
- If the student makes a mistake, acknowledge what they got right first, then help them improve
- Respond in a way that continues the conversation naturally

Important: Your responses will be converted to speech, so:
- Avoid using emojis or special characters
- Write numbers as words when spoken naturally
- Keep sentences flowing and natural for speech`;

class ConversationService {
  private anthropic: Anthropic;
  private conversations: Map<string, ConversationMessage[]>;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.conversations = new Map();
  }

  /**
   * Check if Anthropic is properly configured
   */
  isConfigured(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  /**
   * Start a new conversation session
   */
  startConversation(sessionId: string, mode: PracticeMode): string {
    this.conversations.set(sessionId, []);
    return modeFirstMessages[mode];
  }

  /**
   * Get conversation history
   */
  getConversationHistory(sessionId: string): ConversationMessage[] {
    return this.conversations.get(sessionId) || [];
  }

  /**
   * Clear conversation history
   */
  clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId);
  }

  /**
   * Generate a response using Claude
   */
  async generateResponse(
    sessionId: string,
    userMessage: string,
    mode: PracticeMode
  ): Promise<ConversationResponse> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured');
    }

    // Get or create conversation history
    const history = this.conversations.get(sessionId) || [];

    // Add the user message to history
    history.push({ role: 'user', content: userMessage });

    // Build the system prompt
    const systemPrompt = systemPromptTemplate.replace('{{MODE_PROMPT}}', modePrompts[mode]);

    try {
      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: history.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      // Extract the response text
      const assistantMessage = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      // Add assistant response to history
      history.push({ role: 'assistant', content: assistantMessage });
      this.conversations.set(sessionId, history);

      // Determine emotion based on content
      const emotion = this.detectEmotion(assistantMessage, userMessage);

      return {
        text: assistantMessage,
        emotion,
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate conversation response');
    }
  }

  /**
   * Generate a streaming response using Claude
   */
  async *generateResponseStream(
    sessionId: string,
    userMessage: string,
    mode: PracticeMode
  ): AsyncGenerator<{ text: string; done: boolean }> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured');
    }

    const history = this.conversations.get(sessionId) || [];
    history.push({ role: 'user', content: userMessage });

    const systemPrompt = systemPromptTemplate.replace('{{MODE_PROMPT}}', modePrompts[mode]);

    try {
      const stream = await this.anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages: history.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      let fullResponse = '';

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const text = event.delta.text;
          fullResponse += text;
          yield { text, done: false };
        }
      }

      // Save the complete response to history
      history.push({ role: 'assistant', content: fullResponse });
      this.conversations.set(sessionId, history);

      yield { text: '', done: true };
    } catch (error) {
      console.error('Error generating streaming response:', error);
      throw new Error('Failed to generate conversation response');
    }
  }

  /**
   * Detect appropriate emotion for TTS based on message content
   */
  private detectEmotion(assistantMessage: string, userMessage: string): EmotionType {
    const lowerResponse = assistantMessage.toLowerCase();
    const lowerUser = userMessage.toLowerCase();

    // Check for correction scenarios
    if (lowerResponse.includes('actually') ||
        lowerResponse.includes('not quite') ||
        lowerResponse.includes('close, but')) {
      return 'empathetic';
    }

    // Check for praise/encouragement
    if (lowerResponse.includes('great job') ||
        lowerResponse.includes('well done') ||
        lowerResponse.includes('excellent') ||
        lowerResponse.includes('perfect')) {
      return 'encouraging';
    }

    // Check for excitement (slang mode often)
    if (lowerResponse.includes('ripper') ||
        lowerResponse.includes('beauty') ||
        lowerResponse.includes('!')) {
      return 'excited';
    }

    // Check for questions/curiosity
    if (lowerResponse.includes('?') &&
        (lowerResponse.includes('what') ||
         lowerResponse.includes('how') ||
         lowerResponse.includes('tell me'))) {
      return 'curious';
    }

    // Check for explanations (calm)
    if (lowerResponse.includes('means') ||
        lowerResponse.includes('example') ||
        lowerResponse.includes('in other words')) {
      return 'calm';
    }

    // Default to friendly for general conversation
    return 'friendly';
  }
}

export const conversationService = new ConversationService();
export { ConversationService };

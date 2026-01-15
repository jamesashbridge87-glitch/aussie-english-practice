// Fish Audio API configuration
const FISH_AUDIO_BASE_URL = 'https://api.fish.audio';

interface TTSRequest {
  text: string;
  voiceId?: string;
  format?: 'mp3' | 'wav' | 'opus';
  latency?: 'normal' | 'balanced';
}

interface ASRResponse {
  text: string;
  duration?: number;
  language?: string;
}

interface TTSStreamChunk {
  audio: Buffer;
  done: boolean;
}

class FishAudioService {
  private apiKey: string;
  private defaultVoiceId: string;

  constructor() {
    this.apiKey = process.env.FISH_AUDIO_API_KEY || '';
    this.defaultVoiceId = process.env.FISH_AUDIO_VOICE_ID || '';

    if (!this.apiKey) {
      console.warn('FISH_AUDIO_API_KEY not set - Fish Audio features will be disabled');
    }
  }

  /**
   * Check if Fish Audio is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && !!this.defaultVoiceId;
  }

  /**
   * Transcribe audio using Fish Audio ASR (Speech-to-Text)
   */
  async transcribe(audioBuffer: Buffer, language: string = 'en'): Promise<ASRResponse> {
    if (!this.apiKey) {
      throw new Error('Fish Audio API key not configured');
    }

    const formData = new FormData();
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(audioBuffer);
    const blob = new Blob([uint8Array], { type: 'audio/webm' });
    formData.append('audio', blob, 'audio.webm');
    formData.append('language', language);

    const response = await fetch(`${FISH_AUDIO_BASE_URL}/v1/asr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fish Audio ASR error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: `${FISH_AUDIO_BASE_URL}/v1/asr`,
      });
      throw new Error(`Fish Audio ASR failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Fish Audio ASR result:', result);
    return {
      text: result.text || '',
      duration: result.duration,
      language: result.language,
    };
  }

  /**
   * Convert text to speech using Fish Audio TTS
   * Returns the audio as a Buffer
   */
  async textToSpeech(options: TTSRequest): Promise<Buffer> {
    if (!this.apiKey) {
      throw new Error('Fish Audio API key not configured');
    }

    const voiceId = options.voiceId || this.defaultVoiceId;
    if (!voiceId) {
      throw new Error('Voice ID not specified and no default configured');
    }

    const response = await fetch(`${FISH_AUDIO_BASE_URL}/v1/tts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: options.text,
        reference_id: voiceId,
        format: options.format || 'mp3',
        latency: options.latency || 'balanced',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fish Audio TTS error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        url: `${FISH_AUDIO_BASE_URL}/v1/tts`,
        voiceId,
      });
      throw new Error(`Fish Audio TTS failed: ${response.status} - ${errorText}`);
    }

    console.log('Fish Audio TTS success for voice:', voiceId);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Stream text to speech using Fish Audio WebSocket for low latency
   * Yields audio chunks as they become available
   */
  async *textToSpeechStream(options: TTSRequest): AsyncGenerator<TTSStreamChunk> {
    if (!this.apiKey) {
      throw new Error('Fish Audio API key not configured');
    }

    const voiceId = options.voiceId || this.defaultVoiceId;
    if (!voiceId) {
      throw new Error('Voice ID not specified and no default configured');
    }

    // Use the streaming endpoint
    const response = await fetch(`${FISH_AUDIO_BASE_URL}/v1/tts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: options.text,
        reference_id: voiceId,
        format: options.format || 'mp3',
        latency: options.latency || 'balanced',
        streaming: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fish Audio TTS streaming failed: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    // Read the stream
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          yield { audio: Buffer.alloc(0), done: true };
          break;
        }
        yield { audio: Buffer.from(value), done: false };
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Add emotion markers to text for expressive TTS
   * Fish Audio supports 64+ emotion markers
   */
  addEmotionMarker(text: string, emotion: EmotionType): string {
    const emotionMap: Record<EmotionType, string> = {
      encouraging: '(encouraging)',
      calm: '(calm)',
      happy: '(happy)',
      empathetic: '(empathetic)',
      curious: '(curious)',
      excited: '(excited)',
      friendly: '(friendly)',
      professional: '(professional)',
    };

    const marker = emotionMap[emotion] || '';
    return marker ? `${marker} ${text}` : text;
  }

  /**
   * Get the current voice ID being used
   */
  getVoiceId(): string {
    return this.defaultVoiceId;
  }

  /**
   * Set a different voice ID
   */
  setVoiceId(voiceId: string): void {
    this.defaultVoiceId = voiceId;
  }
}

export type EmotionType =
  | 'encouraging'
  | 'calm'
  | 'happy'
  | 'empathetic'
  | 'curious'
  | 'excited'
  | 'friendly'
  | 'professional';

export const fishAudioService = new FishAudioService();
export { FishAudioService };

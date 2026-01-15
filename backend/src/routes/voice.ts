import { Router, Response, Request } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { fishAudioService, EmotionType } from '../services/fishAudioService.js';
import { conversationService, PracticeMode } from '../services/conversationService.js';
import { z } from 'zod';
import multer from 'multer';

const router = Router();

// Configure multer for audio file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// Validation schemas
const transcribeSchema = z.object({
  language: z.string().optional().default('en'),
});

const ttsSchema = z.object({
  text: z.string().min(1).max(5000),
  emotion: z.enum(['encouraging', 'calm', 'happy', 'empathetic', 'curious', 'excited', 'friendly', 'professional']).optional(),
  format: z.enum(['mp3', 'wav', 'opus']).optional().default('mp3'),
});

const conversationSchema = z.object({
  sessionId: z.string().min(1),
  mode: z.enum(['everyday', 'slang', 'workplace']),
  userText: z.string().min(1).max(1000),
});

const startConversationSchema = z.object({
  sessionId: z.string().min(1),
  mode: z.enum(['everyday', 'slang', 'workplace']),
});

// GET /voice/status - Check if voice services are configured
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    fishAudio: fishAudioService.isConfigured(),
    anthropic: conversationService.isConfigured(),
    ready: fishAudioService.isConfigured() && conversationService.isConfigured(),
  });
});

// POST /voice/transcribe - Transcribe audio using Fish Audio ASR
router.post('/transcribe', authenticate, upload.single('audio'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    const validation = transcribeSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { language } = validation.data;
    const result = await fishAudioService.transcribe(req.file.buffer, language);

    res.json({
      text: result.text,
      duration: result.duration,
      language: result.language,
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// POST /voice/tts - Convert text to speech using Fish Audio TTS
router.post('/tts', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = ttsSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { text, emotion, format } = validation.data;

    // Add emotion marker if specified
    const processedText = emotion
      ? fishAudioService.addEmotionMarker(text, emotion as EmotionType)
      : text;

    const audioBuffer = await fishAudioService.textToSpeech({
      text: processedText,
      format,
      latency: 'balanced',
    });

    // Set appropriate content type
    const contentType = format === 'mp3' ? 'audio/mpeg' :
                        format === 'wav' ? 'audio/wav' :
                        'audio/opus';

    res.set({
      'Content-Type': contentType,
      'Content-Length': audioBuffer.length,
    });

    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// POST /voice/conversation/start - Start a new conversation
router.post('/conversation/start', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = startConversationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { sessionId, mode } = validation.data;
    const firstMessage = conversationService.startConversation(sessionId, mode as PracticeMode);

    res.json({
      message: firstMessage,
      sessionId,
      mode,
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// POST /voice/conversation - Handle a conversation turn (user speaks, AI responds)
router.post('/conversation', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = conversationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
      return;
    }

    const { sessionId, mode, userText } = validation.data;

    // Generate AI response using Claude
    const response = await conversationService.generateResponse(
      sessionId,
      userText,
      mode as PracticeMode
    );

    res.json({
      text: response.text,
      emotion: response.emotion,
    });
  } catch (error) {
    console.error('Conversation error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// POST /voice/conversation/audio - Full conversation turn with audio I/O
// Accepts user audio, returns AI audio response
router.post('/conversation/audio', authenticate, upload.single('audio'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No audio file provided' });
      return;
    }

    const sessionId = req.body.sessionId;
    const mode = req.body.mode as PracticeMode;

    if (!sessionId || !mode) {
      res.status(400).json({ error: 'sessionId and mode are required' });
      return;
    }

    // Step 1: Transcribe user audio
    const transcription = await fishAudioService.transcribe(req.file.buffer, 'en');

    if (!transcription.text || transcription.text.trim() === '') {
      res.status(400).json({ error: 'Could not transcribe audio', userText: '' });
      return;
    }

    // Step 2: Generate AI response
    const aiResponse = await conversationService.generateResponse(
      sessionId,
      transcription.text,
      mode
    );

    // Step 3: Convert AI response to speech
    const processedText = fishAudioService.addEmotionMarker(aiResponse.text, aiResponse.emotion);
    const audioBuffer = await fishAudioService.textToSpeech({
      text: processedText,
      format: 'mp3',
      latency: 'balanced',
    });

    // Return both text and audio
    res.json({
      userText: transcription.text,
      aiText: aiResponse.text,
      emotion: aiResponse.emotion,
      audio: audioBuffer.toString('base64'),
      audioFormat: 'mp3',
    });
  } catch (error) {
    console.error('Conversation audio error:', error);
    res.status(500).json({ error: 'Failed to process conversation' });
  }
});

// POST /voice/conversation/end - End a conversation and clear history
router.post('/conversation/end', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    conversationService.clearConversation(sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error('End conversation error:', error);
    res.status(500).json({ error: 'Failed to end conversation' });
  }
});

export default router;

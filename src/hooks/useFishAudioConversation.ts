import { useState, useCallback, useRef, useEffect } from 'react';

export type PracticeMode = 'everyday' | 'slang' | 'workplace';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface Message {
  source: 'user' | 'ai';
  message: string;
}

interface ConversationOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: Message) => void;
  onError?: (error: Error) => void;
}

interface SessionOptions {
  mode: PracticeMode;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Hook to manage Fish Audio conversations
 * Replaces the ElevenLabs useConversation hook
 */
export function useFishAudioConversation(options: ConversationOptions = {}) {
  const { onConnect, onDisconnect, onMessage, onError } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const modeRef = useRef<PracticeMode>('everyday');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const authTokenRef = useRef<string | null>(null);

  // Get auth token from localStorage
  useEffect(() => {
    authTokenRef.current = localStorage.getItem('auth_token');
  }, []);

  /**
   * Start a new conversation session
   */
  const startSession = useCallback(async (sessionOptions: SessionOptions) => {
    try {
      setStatus('connecting');
      modeRef.current = sessionOptions.mode;

      // Generate a unique session ID
      sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Initialize the conversation on the backend
      const response = await fetch(`${API_BASE_URL}/api/voice/conversation/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokenRef.current}`,
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          mode: sessionOptions.mode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      // Set up MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      setStatus('connected');
      onConnect?.();

      // Send the first message from the AI
      onMessage?.({ source: 'ai', message: data.message });

      // Play the first message using TTS
      await speakText(data.message);

    } catch (error) {
      console.error('Failed to start session:', error);
      setStatus('disconnected');
      onError?.(error instanceof Error ? error : new Error('Failed to start session'));
    }
  }, [onConnect, onError, onMessage]);

  /**
   * End the current session
   */
  const endSession = useCallback(async () => {
    try {
      // Stop recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Stop all tracks
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop any playing audio
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }

      // Notify backend
      if (sessionIdRef.current) {
        await fetch(`${API_BASE_URL}/api/voice/conversation/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authTokenRef.current}`,
          },
          body: JSON.stringify({ sessionId: sessionIdRef.current }),
        });
      }

      sessionIdRef.current = null;
      setStatus('disconnected');
      setIsSpeaking(false);
      setIsListening(false);
      onDisconnect?.();

    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [onDisconnect]);

  /**
   * Start recording user speech
   */
  const startRecording = useCallback(() => {
    if (!mediaRecorderRef.current || status !== 'connected') return;

    audioChunksRef.current = [];
    mediaRecorderRef.current.start();
    setIsListening(true);
  }, [status]);

  /**
   * Stop recording and process the audio
   */
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || !isListening) return;

    return new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        setIsListening(false);
        setIsProcessing(true);

        try {
          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

          // Send to backend for processing
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          formData.append('sessionId', sessionIdRef.current || '');
          formData.append('mode', modeRef.current);

          const response = await fetch(`${API_BASE_URL}/api/voice/conversation/audio`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authTokenRef.current}`,
            },
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to process conversation');
          }

          const data = await response.json();

          // Notify about user message
          if (data.userText) {
            onMessage?.({ source: 'user', message: data.userText });
          }

          // Notify about AI response
          if (data.aiText) {
            onMessage?.({ source: 'ai', message: data.aiText });
          }

          // Play the audio response
          if (data.audio) {
            await playAudioResponse(data.audio, data.audioFormat);
          }

        } catch (error) {
          console.error('Failed to process recording:', error);
          onError?.(error instanceof Error ? error : new Error('Failed to process recording'));
        } finally {
          setIsProcessing(false);
        }

        resolve();
      };

      mediaRecorderRef.current!.stop();
    });
  }, [isListening, onMessage, onError]);

  /**
   * Send a text message (alternative to voice)
   */
  const sendUserMessage = useCallback(async (text: string) => {
    if (!sessionIdRef.current || status !== 'connected') return;

    setIsProcessing(true);

    try {
      // Notify about user message immediately
      onMessage?.({ source: 'user', message: text });

      // Send to backend
      const response = await fetch(`${API_BASE_URL}/api/voice/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokenRef.current}`,
        },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          mode: modeRef.current,
          userText: text,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Notify about AI response
      onMessage?.({ source: 'ai', message: data.text });

      // Get audio for the response
      await speakText(data.text, data.emotion);

    } catch (error) {
      console.error('Failed to send message:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to send message'));
    } finally {
      setIsProcessing(false);
    }
  }, [status, onMessage, onError]);

  /**
   * Convert text to speech and play it
   */
  const speakText = async (text: string, emotion?: string) => {
    try {
      setIsSpeaking(true);

      const response = await fetch(`${API_BASE_URL}/api/voice/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authTokenRef.current}`,
        },
        body: JSON.stringify({
          text,
          emotion,
          format: 'mp3',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      await playAudio(audioUrl);

      URL.revokeObjectURL(audioUrl);

    } catch (error) {
      console.error('Failed to speak:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  /**
   * Play audio from base64 string
   */
  const playAudioResponse = async (base64Audio: string, format: string) => {
    try {
      setIsSpeaking(true);

      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }

      const blob = new Blob([arrayBuffer], { type: `audio/${format}` });
      const audioUrl = URL.createObjectURL(blob);

      await playAudio(audioUrl);

      URL.revokeObjectURL(audioUrl);

    } catch (error) {
      console.error('Failed to play audio:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  /**
   * Play audio from URL
   */
  const playAudio = (audioUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;

      // Set up analyser for output visualization
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaElementSource(audio);
        audioAnalyserRef.current = audioContextRef.current.createAnalyser();
        audioAnalyserRef.current.fftSize = 256;
        source.connect(audioAnalyserRef.current);
        audioAnalyserRef.current.connect(audioContextRef.current.destination);
      }

      audio.onended = () => {
        audioElementRef.current = null;
        resolve();
      };

      audio.onerror = () => {
        reject(new Error('Failed to play audio'));
      };

      audio.play().catch(reject);
    });
  };

  /**
   * Get input (microphone) frequency data for visualization
   */
  const getInputByteFrequencyData = useCallback((): Uint8Array | null => {
    if (!analyserRef.current) return null;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    return dataArray;
  }, []);

  /**
   * Get output (speaker) frequency data for visualization
   */
  const getOutputByteFrequencyData = useCallback((): Uint8Array | null => {
    if (!audioAnalyserRef.current) return null;
    const dataArray = new Uint8Array(audioAnalyserRef.current.frequencyBinCount);
    audioAnalyserRef.current.getByteFrequencyData(dataArray);
    return dataArray;
  }, []);

  /**
   * Send user activity signal (for typing indicator)
   */
  const sendUserActivity = useCallback(() => {
    // This is a no-op for now, but could be used for typing indicators
  }, []);

  /**
   * Send feedback (not implemented for Fish Audio)
   */
  const sendFeedback = useCallback((_positive: boolean) => {
    // Feedback is handled separately through the sessions API
  }, []);

  return {
    // State
    status,
    isSpeaking,
    isListening,
    isProcessing,

    // Session management
    startSession,
    endSession,

    // Recording
    startRecording,
    stopRecording,

    // Text messaging
    sendUserMessage,
    sendUserActivity,
    sendFeedback,

    // Audio visualization
    getInputByteFrequencyData,
    getOutputByteFrequencyData,
  };
}

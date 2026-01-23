import { useState, useCallback, useRef, useEffect } from 'react';
import DailyIframe, { DailyCall, DailyEventObjectTrack } from '@daily-co/daily-js';

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

// Auto-detect production environment and use correct backend URL
function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  const hostname = window.location.hostname;

  if (hostname === 'youraussieuncle.io' || hostname === 'www.youraussieuncle.io') {
    return 'https://aussie-english-practice-production-ef99.up.railway.app';
  }

  return 'http://localhost:3001';
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Hook to manage real-time voice conversations using Daily WebRTC
 * Uses Pipecat backend for low-latency voice AI
 */
export function useDailyConversation(options: ConversationOptions = {}) {
  const { onConnect, onDisconnect, onMessage, onError } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const callRef = useRef<DailyCall | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Get auth token from localStorage
  useEffect(() => {
    authTokenRef.current = localStorage.getItem('auth_token');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callRef.current) {
        callRef.current.destroy();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  /**
   * Start a new conversation session with Daily room
   */
  const startSession = useCallback(async (sessionOptions: SessionOptions) => {
    try {
      setStatus('connecting');

      // Request a Daily room from our backend
      const response = await fetch(`${API_BASE_URL}/api/voice/room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authTokenRef.current && { 'Authorization': `Bearer ${authTokenRef.current}` }),
        },
        body: JSON.stringify({
          mode: sessionOptions.mode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create voice room');
      }

      const { room_url, token } = await response.json();

      // Create Daily call object
      const call = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: false,
      });

      callRef.current = call;

      // Set up event listeners
      call.on('joined-meeting', () => {
        setStatus('connected');
        setIsListening(true);
        onConnect?.();

        // Set up audio context for visualization
        setupAudioVisualization(call);
      });

      call.on('left-meeting', () => {
        setStatus('disconnected');
        setIsListening(false);
        setIsSpeaking(false);
        onDisconnect?.();
      });

      call.on('participant-joined', (event) => {
        if (event?.participant && !event.participant.local) {
          // Bot joined
          onMessage?.({ source: 'ai', message: "G'day mate! Ready to practice some Aussie English?" });
        }
      });

      call.on('track-started', (event: DailyEventObjectTrack) => {
        if (event.track?.kind === 'audio' && event.participant && !event.participant.local) {
          // Remote audio track started - bot is speaking
          setIsSpeaking(true);

          // Create audio element for remote track
          const audio = new Audio();
          audio.srcObject = new MediaStream([event.track]);
          audio.play().catch(console.error);
          remoteAudioRef.current = audio;

          // Set up output analyser
          if (audioContextRef.current && event.track) {
            const source = audioContextRef.current.createMediaStreamSource(new MediaStream([event.track]));
            outputAnalyserRef.current = audioContextRef.current.createAnalyser();
            outputAnalyserRef.current.fftSize = 256;
            source.connect(outputAnalyserRef.current);
          }
        }
      });

      call.on('track-stopped', (event: DailyEventObjectTrack) => {
        if (event.track?.kind === 'audio' && event.participant && !event.participant.local) {
          setIsSpeaking(false);
        }
      });

      call.on('error', (event) => {
        console.error('Daily error:', event);
        onError?.(new Error(event?.errorMsg || 'Call error'));
      });

      call.on('app-message', (event) => {
        // Handle transcript messages from the bot
        if (event?.data?.type === 'transcript') {
          const { role, content } = event.data;
          onMessage?.({
            source: role === 'user' ? 'user' : 'ai',
            message: content,
          });
        }
      });

      // Join the room
      await call.join({
        url: room_url,
        token: token,
      });

    } catch (error) {
      console.error('Failed to start session:', error);
      setStatus('disconnected');
      onError?.(error instanceof Error ? error : new Error('Failed to start session'));
    }
  }, [onConnect, onDisconnect, onMessage, onError]);

  /**
   * Set up audio visualization
   */
  const setupAudioVisualization = (call: DailyCall) => {
    try {
      audioContextRef.current = new AudioContext();

      // Get local audio track for input visualization
      const localParticipant = call.participants().local;
      if (localParticipant?.tracks?.audio?.track) {
        const stream = new MediaStream([localParticipant.tracks.audio.track]);
        localStreamRef.current = stream;

        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
      }
    } catch (error) {
      console.error('Failed to setup audio visualization:', error);
    }
  };

  /**
   * End the current session
   */
  const endSession = useCallback(async () => {
    try {
      if (callRef.current) {
        await callRef.current.leave();
        callRef.current.destroy();
        callRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current = null;
      }

      setStatus('disconnected');
      setIsSpeaking(false);
      setIsListening(false);

    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, []);

  /**
   * Toggle microphone mute
   */
  const toggleMute = useCallback(() => {
    if (callRef.current) {
      const newMutedState = !isMuted;
      callRef.current.setLocalAudio(!newMutedState);
      setIsMuted(newMutedState);
      setIsListening(!newMutedState);
    }
  }, [isMuted]);

  /**
   * Mute microphone
   */
  const mute = useCallback(() => {
    if (callRef.current && !isMuted) {
      callRef.current.setLocalAudio(false);
      setIsMuted(true);
      setIsListening(false);
    }
  }, [isMuted]);

  /**
   * Unmute microphone
   */
  const unmute = useCallback(() => {
    if (callRef.current && isMuted) {
      callRef.current.setLocalAudio(true);
      setIsMuted(false);
      setIsListening(true);
    }
  }, [isMuted]);

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
    if (!outputAnalyserRef.current) return null;
    const dataArray = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
    outputAnalyserRef.current.getByteFrequencyData(dataArray);
    return dataArray;
  }, []);

  // Compatibility methods (for backwards compatibility with old hook)
  const startRecording = useCallback(() => {
    unmute();
  }, [unmute]);

  const stopRecording = useCallback(async () => {
    // In real-time mode, we don't need to explicitly stop recording
    // The VAD handles turn-taking automatically
  }, []);

  const sendUserMessage = useCallback(async (_text: string) => {
    // Text input not supported in real-time mode
    console.warn('Text input not supported in real-time voice mode');
  }, []);

  const sendUserActivity = useCallback(() => {
    // No-op for Daily mode
  }, []);

  const sendFeedback = useCallback((_positive: boolean) => {
    // Feedback handled separately
  }, []);

  return {
    // State
    status,
    isSpeaking,
    isListening,
    isMuted,
    isProcessing: false, // Not used in real-time mode

    // Session management
    startSession,
    endSession,

    // Mute controls
    toggleMute,
    mute,
    unmute,

    // Recording (compatibility)
    startRecording,
    stopRecording,

    // Text messaging (compatibility)
    sendUserMessage,
    sendUserActivity,
    sendFeedback,

    // Audio visualization
    getInputByteFrequencyData,
    getOutputByteFrequencyData,
  };
}

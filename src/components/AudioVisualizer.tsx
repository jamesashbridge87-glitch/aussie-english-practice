import { useEffect, useRef, useCallback } from 'react';
import './AudioVisualizer.css';

interface AudioVisualizerProps {
  getInputFrequencyData: () => Uint8Array | null;
  getOutputFrequencyData: () => Uint8Array | null;
  isActive: boolean;
  isSpeaking: boolean;
}

export function AudioVisualizer({
  getInputFrequencyData,
  getOutputFrequencyData,
  isActive,
  isSpeaking,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get frequency data
    const inputData = getInputFrequencyData();
    const outputData = getOutputFrequencyData();

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2;
    const barWidth = 3;
    const gap = 2;
    const totalBarWidth = barWidth + gap;

    // Draw waveform
    if (isActive) {
      // Use output data when agent is speaking, input data when listening
      const data = isSpeaking ? outputData : inputData;
      const color = isSpeaking ? '#22c55e' : '#00843D'; // Green when speaking, Aussie green when listening

      if (data && data.length > 0) {
        const numBars = Math.min(Math.floor(canvas.width / totalBarWidth), data.length);
        const startX = (canvas.width - numBars * totalBarWidth) / 2;

        ctx.fillStyle = color;

        for (let i = 0; i < numBars; i++) {
          // Sample from frequency data
          const dataIndex = Math.floor((i / numBars) * data.length);
          const value = data[dataIndex] / 255;

          // Calculate bar height with some smoothing
          const barHeight = Math.max(2, value * (canvas.height * 0.4));

          const x = startX + i * totalBarWidth;

          // Draw bar from center, extending up and down
          ctx.beginPath();
          ctx.roundRect(x, centerY - barHeight, barWidth, barHeight * 2, 1);
          ctx.fill();
        }
      } else {
        // Draw idle animation when no audio data
        drawIdleWave(ctx, canvas, centerY, barWidth, gap, color);
      }
    } else {
      // Draw flat line when inactive
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(0, centerY - 1, canvas.width, 2);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [getInputFrequencyData, getOutputFrequencyData, isActive, isSpeaking]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const updateSize = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 80;
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    // Start animation loop
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  return (
    <div className="audio-visualizer">
      <canvas ref={canvasRef} />
      <div className="visualizer-label">
        {isActive ? (isSpeaking ? 'Teacher speaking' : 'Listening to you') : 'Ready to start'}
      </div>
    </div>
  );
}

// Draw a gentle idle wave animation
function drawIdleWave(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  centerY: number,
  barWidth: number,
  gap: number,
  color: string
) {
  const time = Date.now() / 1000;
  const numBars = Math.floor(canvas.width / (barWidth + gap));
  const startX = (canvas.width - numBars * (barWidth + gap)) / 2;

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.5;

  for (let i = 0; i < numBars; i++) {
    const x = startX + i * (barWidth + gap);
    const wave = Math.sin(time * 2 + i * 0.2) * 0.5 + 0.5;
    const barHeight = 4 + wave * 8;

    ctx.beginPath();
    ctx.roundRect(x, centerY - barHeight, barWidth, barHeight * 2, 1);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

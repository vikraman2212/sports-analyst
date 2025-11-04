/**
 * Mock Camera Stream Utilities
 * 
 * Provides fake MediaStream for development and testing without physical camera.
 * Useful for:
 * - Testing on machines without cameras
 * - Automated testing
 * - Consistent test data
 * - Debugging detection algorithms
 */

/**
 * Configuration for mock camera stream
 */
export interface MockCameraConfig {
  /**
   * Video width in pixels
   * @default 640
   */
  width?: number;

  /**
   * Video height in pixels
   * @default 480
   */
  height?: number;

  /**
   * Frame rate (frames per second)
   * @default 30
   */
  frameRate?: number;

  /**
   * Animation type
   * @default 'linear'
   */
  animationType?: 'linear' | 'arc' | 'diagonal' | 'random';

  /**
   * Show frame counter overlay
   * @default true
   */
  showFrameCounter?: boolean;

  /**
   * Show grid overlay for calibration
   * @default false
   */
  showGrid?: boolean;
}

const DEFAULT_CONFIG: Required<MockCameraConfig> = {
  width: 640,
  height: 480,
  frameRate: 30,
  animationType: 'arc',
  showFrameCounter: true,
  showGrid: false,
};

/**
 * Create a fake MediaStream with animated ball for testing
 * 
 * @param config - Configuration options
 * @returns MediaStream that can be used like real camera
 * 
 * @example
 * ```typescript
 * const stream = createMockVideoStream({ animationType: 'arc' });
 * videoElement.srcObject = stream;
 * ```
 */
export function createMockVideoStream(
  config: MockCameraConfig = {}
): MediaStream {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Create off-screen canvas
  const canvas = document.createElement('canvas');
  canvas.width = cfg.width;
  canvas.height = cfg.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas 2D context');
  }

  let frame = 0;

  /**
   * Calculate ball position based on animation type
   */
  const getBallPosition = (frameNum: number): { x: number; y: number } => {
    const progress = (frameNum % 90) / 90; // Reset every 90 frames (~3 seconds)

    switch (cfg.animationType) {
      case 'linear':
        // Straight horizontal motion
        return {
          x: 50 + progress * (cfg.width - 100),
          y: cfg.height / 2,
        };

      case 'arc':
        // Parabolic arc (simulates cricket ball trajectory)
        return {
          x: 50 + progress * (cfg.width - 100),
          y: cfg.height / 2 + Math.sin(progress * Math.PI) * 150,
        };

      case 'diagonal':
        // Diagonal motion
        return {
          x: 50 + progress * (cfg.width - 100),
          y: 50 + progress * (cfg.height - 100),
        };

      case 'random':
        // Random walk with some smoothing
        return {
          x: 50 + Math.random() * (cfg.width - 100),
          y: 50 + Math.random() * (cfg.height - 100),
        };

      default:
        return { x: cfg.width / 2, y: cfg.height / 2 };
    }
  };

  /**
   * Draw single frame
   */
  const drawFrame = (): void => {
    // Background - dark green (cricket pitch color)
    ctx.fillStyle = '#1a5f1a';
    ctx.fillRect(0, 0, cfg.width, cfg.height);

    // Draw grid if enabled (for calibration)
    if (cfg.showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = 0; x < cfg.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cfg.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < cfg.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cfg.width, y);
        ctx.stroke();
      }

      // Center cross
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cfg.width / 2, 0);
      ctx.lineTo(cfg.width / 2, cfg.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, cfg.height / 2);
      ctx.lineTo(cfg.width, cfg.height / 2);
      ctx.stroke();
    }

    // Draw pitch outline (simplified)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, cfg.width - 100, cfg.height - 100);

    // Draw ball
    const { x, y } = getBallPosition(frame);

    // Ball shadow (for depth)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x + 3, y + 3, 18, 0, Math.PI * 2);
    ctx.fill();

    // Ball (red cricket ball)
    ctx.fillStyle = '#cc0000';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Ball seam (cricket ball detail)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0.3, Math.PI - 0.3);
    ctx.stroke();

    // Frame counter overlay
    if (cfg.showFrameCounter) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 180, 80);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`Frame: ${frame}`, 20, 35);
      ctx.fillText(`Position: ${Math.round(x)}, ${Math.round(y)}`, 20, 60);
      ctx.fillText(`Type: ${cfg.animationType}`, 20, 85);
    }

    // Animation info (bottom right)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(cfg.width - 170, cfg.height - 40, 160, 30);

    ctx.fillStyle = '#ffff00';
    ctx.font = '14px monospace';
    ctx.fillText('🎥 MOCK CAMERA', cfg.width - 160, cfg.height - 18);

    frame++;
  };

  // Start animation loop
  const intervalMs = 1000 / cfg.frameRate;
  const animationInterval = setInterval(drawFrame, intervalMs);

  // Capture stream from canvas
  const stream = canvas.captureStream(cfg.frameRate);

  // Store cleanup function on stream for later disposal
  (stream as MediaStream & { _cleanup?: () => void })._cleanup = () => {
    clearInterval(animationInterval);
  };

  return stream;
}

/**
 * Create MediaStream from a video file
 * 
 * @param videoUrl - URL to video file (can be relative path from public/)
 * @returns Promise that resolves to MediaStream
 * 
 * @example
 * ```typescript
 * const stream = await createVideoFileStream('/test-videos/delivery.mp4');
 * videoElement.srcObject = stream;
 * ```
 */
export async function createVideoFileStream(
  videoUrl: string
): Promise<MediaStream> {
  const video = document.createElement('video');
  video.src = videoUrl;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;

  // Wait for video to load
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error(`Failed to load video: ${videoUrl}`));
  });

  // Start playing
  await video.play();

  // Capture stream from video element
  // TypeScript doesn't have captureStream in HTMLVideoElement type, but it exists in modern browsers
  const stream = (video as HTMLVideoElement & { captureStream(): MediaStream }).captureStream();

  // Store cleanup function
  (stream as MediaStream & { _cleanup?: () => void })._cleanup = () => {
    video.pause();
    video.src = '';
  };

  return stream;
}

/**
 * Stop and cleanup a mock camera stream
 * 
 * @param stream - MediaStream to cleanup
 */
export function disposeMockStream(stream: MediaStream): void {
  // Stop all tracks
  stream.getTracks().forEach((track) => track.stop());

  // Call custom cleanup if available
  const cleanup = (stream as MediaStream & { _cleanup?: () => void })._cleanup;
  if (cleanup) {
    cleanup();
  }
}

/**
 * Check if current environment should use mock camera
 * 
 * @returns true if mock camera should be used
 */
export function shouldUseMockCamera(): boolean {
  // Check environment variable
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_USE_MOCK_CAMERA === 'true') {
    return true;
  }

  // Check localStorage (can be toggled at runtime)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('USE_MOCK_CAMERA') === 'true';
  }

  return false;
}

/**
 * Enable mock camera for current session
 */
export function enableMockCamera(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('USE_MOCK_CAMERA', 'true');
    // eslint-disable-next-line no-console
    console.info('Mock camera enabled. Reload page to take effect.');
  }
}

/**
 * Disable mock camera for current session
 */
export function disableMockCamera(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('USE_MOCK_CAMERA');
    // eslint-disable-next-line no-console
    console.info('Mock camera disabled. Reload page to take effect.');
  }
}

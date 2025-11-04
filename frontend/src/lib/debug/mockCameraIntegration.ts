/**
 * Mock Camera Integration Example
 * 
 * Shows how to integrate mock camera stream into useCameraFeed hook.
 * 
 * To enable mock camera:
 * 
 * Option 1: Environment variable (permanent for development)
 * Create or update `frontend/.env.local`:
 * ```
 * NEXT_PUBLIC_USE_MOCK_CAMERA=true
 * ```
 * 
 * Option 2: Browser console (temporary for testing)
 * ```javascript
 * localStorage.setItem('USE_MOCK_CAMERA', 'true');
 * location.reload();
 * ```
 * 
 * To disable:
 * ```javascript
 * localStorage.removeItem('USE_MOCK_CAMERA');
 * location.reload();
 * ```
 */

import { createMockVideoStream, shouldUseMockCamera, type MockCameraConfig } from './mockCameraStream';

/**
 * Get camera stream (real or mock based on configuration)
 * 
 * This function can be used in useCameraFeed.ts to conditionally
 * use mock camera instead of real camera.
 * 
 * @param constraints - getUserMedia constraints
 * @param mockConfig - Mock camera configuration (if using mock)
 * @returns MediaStream (real or mock)
 */
export async function getCameraStream(
  constraints: MediaStreamConstraints,
  mockConfig?: MockCameraConfig
): Promise<MediaStream> {
  // Check if mock camera should be used
  if (shouldUseMockCamera()) {
    console.warn('🎥 Using MOCK camera stream (not real camera)');
    
    // Create mock stream with config matching constraints
    const width = typeof constraints.video === 'object' && constraints.video !== null && 'width' in constraints.video
      ? (typeof constraints.video.width === 'object' && constraints.video.width !== null && 'ideal' in constraints.video.width
          ? Number(constraints.video.width.ideal)
          : 640)
      : 640;
    
    const height = typeof constraints.video === 'object' && constraints.video !== null && 'height' in constraints.video
      ? (typeof constraints.video.height === 'object' && constraints.video.height !== null && 'ideal' in constraints.video.height
          ? Number(constraints.video.height.ideal)
          : 480)
      : 480;
    
    const frameRate = typeof constraints.video === 'object' && constraints.video !== null && 'frameRate' in constraints.video
      ? (typeof constraints.video.frameRate === 'object' && constraints.video.frameRate !== null && 'ideal' in constraints.video.frameRate
          ? Number(constraints.video.frameRate.ideal)
          : 30)
      : 30;

    return createMockVideoStream({
      width,
      height,
      frameRate,
      ...mockConfig,
    });
  }

  // Use real camera
  return navigator.mediaDevices.getUserMedia(constraints);
}

/**
 * Example integration into useCameraFeed hook
 * 
 * Replace this code in useCameraFeed.ts startCamera function:
 * 
 * ```typescript
 * // OLD:
 * const mediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
 * 
 * // NEW:
 * import { getCameraStream } from '@/lib/debug/mockCameraIntegration';
 * 
 * const mediaStream = await getCameraStream(mediaConstraints, {
 *   animationType: 'arc',  // Simulates cricket ball trajectory
 *   showFrameCounter: true,
 *   showGrid: false,
 * });
 * ```
 * 
 * This will automatically use mock camera when:
 * - NEXT_PUBLIC_USE_MOCK_CAMERA=true in .env.local
 * - localStorage.getItem('USE_MOCK_CAMERA') === 'true'
 * 
 * Otherwise, it will use the real camera.
 */

/**
 * Utility: Toggle mock camera from browser console
 * 
 * Add this to window for easy debugging:
 * 
 * In your _app.tsx or layout.tsx (development only):
 * ```typescript
 * if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
 *   import('@/lib/debug/mockCameraStream').then(({ enableMockCamera, disableMockCamera }) => {
 *     (window as any).enableMockCamera = enableMockCamera;
 *     (window as any).disableMockCamera = disableMockCamera;
 *   });
 * }
 * ```
 * 
 * Then in browser console:
 * ```javascript
 * enableMockCamera()   // Enable mock camera
 * disableMockCamera()  // Disable mock camera
 * ```
 */

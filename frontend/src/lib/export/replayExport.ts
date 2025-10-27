/**
 * Replay Export Utilities
 * 
 * Export replay sessions as PNG screenshots, WebM videos, or JSON data.
 */

import type { ReplaySession, ExportOptions, ExportFormat } from '../replay/types';
import { TrajectoryRenderer } from '../replay/trajectoryRenderer';

/**
 * Export replay session in specified format
 * 
 * Note: The trajectory-only approach means exports already contain only
 * detected ball points. The includeTrimmedOnly option is available for
 * future enhancements if frame-by-frame video replay is added.
 */
export async function exportReplay(
  session: ReplaySession,
  options: ExportOptions
): Promise<void> {
  // Note: includeTrimmedOnly defaults to true but isn't needed for trajectory-only exports
  // since we already only have detected points in session.delivery.trajectoryPoints

  switch (options.format) {
    case 'png':
      await exportAsPNG(session, options);
      break;
    case 'webm':
      await exportAsWebM(session, options);
      break;
    case 'json':
      exportAsJSON(session, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Export replay as PNG screenshot
 */
async function exportAsPNG(
  session: ReplaySession,
  options: ExportOptions
): Promise<void> {
  // Create temporary canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1920; // Full HD width
  canvas.height = 1080; // Full HD height

  // Create renderer
  const renderer = new TrajectoryRenderer(
    canvas,
    session,
    'side',
    {
      showSpeed: options.includeAnnotations,
      showBouncePoint: options.includeAnnotations,
      showLength: options.includeAnnotations,
      showSwing: false,
      showGrid: true,
    }
  );

  // Render final frame (end of trajectory)
  renderer.render(session.durationMs);

  // Convert to blob
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png', 1.0);
  });

  if (!blob) {
    throw new Error('Failed to create PNG blob');
  }

  // Download
  const filename = options.filenamePrefix
    ? `${options.filenamePrefix}_${session.id}.png`
    : `trajectory_${session.id}.png`;

  downloadBlob(blob, filename);
}

/**
 * Export replay as WebM video
 */
async function exportAsWebM(
  session: ReplaySession,
  options: ExportOptions
): Promise<void> {
  // Create temporary canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;

  // Create renderer
  const renderer = new TrajectoryRenderer(
    canvas,
    session,
    'side',
    {
      showSpeed: options.includeAnnotations,
      showBouncePoint: options.includeAnnotations,
      showLength: options.includeAnnotations,
      showSwing: false,
      showGrid: true,
    }
  );

  // Set up MediaRecorder
  const stream = canvas.captureStream(30); // 30 FPS
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality at ~500KB for 3s
  });

  const chunks: Blob[] = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  // Start recording
  mediaRecorder.start();

  // Animate and record
  const fps = 30;
  const frameDuration = 1000 / fps;
  const videoDuration = options.videoDurationSeconds ?? 3; // Default 3 seconds
  const totalFrames = Math.ceil((videoDuration * 1000) / frameDuration);

  for (let frame = 0; frame <= totalFrames; frame++) {
    const progress = frame / totalFrames;
    const currentTime = progress * session.durationMs;

    renderer.render(currentTime);

    // Wait for frame duration
    await new Promise((resolve) => setTimeout(resolve, frameDuration));
  }

  // Stop recording and wait for data
  await new Promise<void>((resolve) => {
    mediaRecorder.onstop = () => resolve();
    mediaRecorder.stop();
  });

  // Create blob from chunks
  const blob = new Blob(chunks, { type: 'video/webm' });

  // Download
  const filename = options.filenamePrefix
    ? `${options.filenamePrefix}_${session.id}.webm`
    : `trajectory_${session.id}.webm`;

  downloadBlob(blob, filename);
}

/**
 * Export replay as JSON
 */
function exportAsJSON(session: ReplaySession, options: ExportOptions): void {
  // Use existing JSON export for delivery
  const deliveryExport = {
    session: {
      id: session.id,
      createdAt: session.createdAt.toISOString(),
      durationMs: session.durationMs,
      startMs: session.startMs,
      endMs: session.endMs,
    },
    delivery: session.delivery,
  };

  const jsonString = JSON.stringify(deliveryExport, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  const filename = options.filenamePrefix
    ? `${options.filenamePrefix}_${session.id}.json`
    : `trajectory_${session.id}.json`;

  downloadBlob(blob, filename);
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Check if browser supports required export features
 */
export function checkExportSupport(): {
  png: boolean;
  webm: boolean;
  json: boolean;
} {
  return {
    png: true, // Canvas toBlob is widely supported
    webm: typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm;codecs=vp9'),
    json: true, // Always supported
  };
}

/**
 * Get estimated export size in bytes
 */
export function estimateExportSize(
  session: ReplaySession,
  format: ExportFormat
): number {
  switch (format) {
    case 'png':
      // Full HD PNG with compression ~500KB
      return 500 * 1024;
    case 'webm':
      // 3 seconds at 2.5 Mbps ≈ 500KB
      return 500 * 1024;
    case 'json':
      // JSON size depends on trajectory points
      const pointCount = session.delivery.trajectoryPoints.length;
      const bytesPerPoint = 80; // Approximate JSON size per point
      return pointCount * bytesPerPoint + 1024; // +1KB for metadata
    default:
      return 0;
  }
}

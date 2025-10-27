/**
 * Replay System Types
 * 
 * Type definitions for trajectory-only replay with Hawk-Eye style visualization.
 * Supports side view and top-down wagon wheel view modes.
 */

import type { TrajectoryPoint, DeliveryResult } from '../types';

/**
 * View mode for trajectory replay
 */
export type ViewMode = 'side' | 'top-down';

/**
 * Playback state
 */
export type PlaybackState = 'idle' | 'playing' | 'paused' | 'complete';

/**
 * Static frame captured at ball release for context
 */
export interface StaticFrame {
  imageData: ImageData;
  width: number;
  height: number;
  capturedAtMs: number;
}

/**
 * Complete replay session data
 */
export interface ReplaySession {
  /** Unique session identifier */
  id: string;

  /** Session creation timestamp */
  createdAt: Date;

  /** Delivery analysis result */
  delivery: DeliveryResult;

  /** Static frame for context (~900KB) */
  staticFrame: StaticFrame | null;

  /** Duration in milliseconds */
  durationMs: number;

  /** Start timestamp (from first trajectory point) */
  startMs: number;

  /** End timestamp (from last trajectory point) */
  endMs: number;
}

/**
 * Playback configuration
 */
export interface PlaybackConfig {
  /** Playback speed multiplier (1.0 = real-time) */
  speed: number;

  /** Whether to loop playback */
  loop: boolean;

  /** View mode */
  viewMode: ViewMode;
}

/**
 * Annotation configuration for trajectory overlay
 */
export interface AnnotationConfig {
  /** Show speed at release */
  showSpeed: boolean;

  /** Show bounce point marker */
  showBouncePoint: boolean;

  /** Show length marker (good/short/full) */
  showLength: boolean;

  /** Show swing/deviation markers */
  showSwing: boolean;

  /** Show grid/pitch lines */
  showGrid: boolean;
}

/**
 * Rendering dimensions and scale
 */
export interface RenderDimensions {
  /** Canvas width in pixels */
  width: number;

  /** Canvas height in pixels */
  height: number;

  /** Scale factor for trajectory coordinates */
  scale: number;

  /** Offset for centering */
  offsetX: number;
  offsetY: number;
}

/**
 * Point in 3D space for rendering
 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Cricket pitch zones for length analysis
 */
export type PitchZone = 'yorker' | 'full' | 'good' | 'short' | 'bouncer';

/**
 * Bounce point analysis
 */
export interface BouncePoint {
  /** Point where ball bounced */
  point: TrajectoryPoint;

  /** Index in trajectory */
  index: number;

  /** Length classification */
  zone: PitchZone;

  /** Distance from stumps in meters */
  distanceFromStumps: number;
}

/**
 * Export format options
 */
export type ExportFormat = 'png' | 'webm' | 'json';

/**
 * Export options configuration
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat;

  /** Include annotations in export */
  includeAnnotations: boolean;

  /** Video quality (0.0-1.0) for WebM export */
  videoQuality?: number;

  /** Video duration in seconds for WebM export */
  videoDurationSeconds?: number;

  /** Filename prefix */
  filenamePrefix?: string;

  /** Include only trimmed portion (default: true) */
  includeTrimmedOnly?: boolean;
}

/**
 * Smart trim result from detection-based analysis
 */
export interface TrimResult {
  /** Index of first ball detection */
  firstDetectionIndex: number;

  /** Index of last ball detection */
  lastDetectionIndex: number;

  /** Total frames in recording */
  totalFrames: number;

  /** Number of frames with ball detected */
  trimmedFrames: number;

  /** Efficiency percentage (trimmed / total) */
  efficiency: number;

  /** Warning if efficiency is very low */
  warning?: string;
}

/**
 * SpeedDisplay Component
 * 
 * Displays cricket ball delivery speed and related metrics.
 * 
 * Features:
 * - Large, readable speed display
 * - Confidence indicator
 * - Detection quality metrics
 * - Warning messages
 * - Responsive design for mobile and desktop
 */

'use client';

import type { DeliveryResult } from '../lib/types';

export interface SpeedDisplayProps {
  /**
   * Delivery analysis result to display
   */
  result: DeliveryResult | null;

  /**
   * Whether to show detailed metrics (confidence, detection count, etc.)
   * @default true
   */
  showDetails?: boolean;

  /**
   * Whether to show warning messages
   * @default true
   */
  showWarnings?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * Callback when user interacts (future: mph/kmh toggle)
   */
  onInteraction?: () => void;
}

/**
 * Get confidence level description and color
 */
function getConfidenceInfo(confidence: number): {
  level: string;
  color: string;
  description: string;
} {
  if (confidence >= 0.9) {
    return {
      level: 'Excellent',
      color: '#00C853',
      description: 'Very reliable measurement',
    };
  } else if (confidence >= 0.75) {
    return {
      level: 'Good',
      color: '#FFB300',
      description: 'Reliable measurement',
    };
  } else if (confidence >= 0.6) {
    return {
      level: 'Fair',
      color: '#FF6F00',
      description: 'Acceptable measurement',
    };
  } else {
    return {
      level: 'Low',
      color: '#D32F2F',
      description: 'Uncertain measurement',
    };
  }
}

/**
 * Get detection count quality indicator
 */
function getDetectionQuality(count: number): {
  quality: string;
  color: string;
} {
  if (count >= 15) {
    return { quality: 'Excellent', color: '#00C853' };
  } else if (count >= 10) {
    return { quality: 'Good', color: '#FFB300' };
  } else if (count >= 5) {
    return { quality: 'Fair', color: '#FF6F00' };
  } else {
    return { quality: 'Low', color: '#D32F2F' };
  }
}

/**
 * SpeedDisplay Component
 * 
 * Displays ball speed with visual indicators for quality and reliability.
 */
export function SpeedDisplay({
  result,
  showDetails = true,
  showWarnings = true,
  className = '',
  onInteraction,
}: SpeedDisplayProps) {
  // No result state
  if (!result) {
    return (
      <div className={`speed-display speed-display--empty ${className}`}>
        <div className="speed-display__empty-state">
          <div className="speed-display__empty-icon">🏏</div>
          <p className="speed-display__empty-text">
            No delivery recorded yet
          </p>
          <p className="speed-display__empty-hint">
            Start recording to analyze ball speed
          </p>
        </div>

        <style jsx>{`
          .speed-display--empty {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            min-height: 200px;
          }

          .speed-display__empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            text-align: center;
            color: rgba(255, 255, 255, 0.6);
          }

          .speed-display__empty-icon {
            font-size: 3rem;
            opacity: 0.5;
          }

          .speed-display__empty-text {
            font-size: 1.1rem;
            font-weight: 500;
            margin: 0;
          }

          .speed-display__empty-hint {
            font-size: 0.9rem;
            margin: 0;
            opacity: 0.8;
          }
        `}</style>
      </div>
    );
  }

  const confidenceInfo = getConfidenceInfo(result.confidence);
  const detectionQuality = getDetectionQuality(result.detectionCount);
  const hasWarnings = showWarnings && result.warnings && result.warnings.length > 0;

  return (
    <div 
      className={`speed-display ${className}`}
      onClick={onInteraction}
      role={onInteraction ? 'button' : 'region'}
      aria-label="Ball speed analysis results"
      tabIndex={onInteraction ? 0 : undefined}
      onKeyDown={onInteraction ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onInteraction();
        }
      } : undefined}
    >
      {/* Main Speed Display */}
      <div className="speed-display__main">
        <div className="speed-display__speed-container" role="status" aria-label={`Ball speed: ${result.speedKmh.toFixed(1)} kilometers per hour`}>
          <div className="speed-display__speed-value" aria-hidden="true">
            {result.speedKmh.toFixed(1)}
          </div>
          <div className="speed-display__speed-unit" aria-hidden="true">km/h</div>
        </div>

        {/* Confidence Indicator */}
        <div 
          className="speed-display__confidence-badge"
          style={{ backgroundColor: confidenceInfo.color }}
          role="status"
          aria-label={`Confidence: ${confidenceInfo.level}, ${(result.confidence * 100).toFixed(0)} percent. ${confidenceInfo.description}`}
        >
          <span className="speed-display__confidence-level" aria-hidden="true">
            {confidenceInfo.level}
          </span>
          <span className="speed-display__confidence-value" aria-hidden="true">
            {(result.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Details Section */}
      {showDetails && (
        <div className="speed-display__details" role="region" aria-label="Detailed metrics">
          <div className="speed-display__detail-grid">
            {/* Detection Count */}
            <div className="speed-display__detail-item">
              <div className="speed-display__detail-label">Detections</div>
              <div className="speed-display__detail-value">
                {result.detectionCount}
                <span 
                  className="speed-display__quality-badge"
                  style={{ color: detectionQuality.color }}
                >
                  {detectionQuality.quality}
                </span>
              </div>
            </div>

            {/* Processing Time */}
            <div className="speed-display__detail-item">
              <div className="speed-display__detail-label">Processing</div>
              <div className="speed-display__detail-value">
                {result.processingMs}ms
              </div>
            </div>

            {/* Trajectory Points */}
            <div className="speed-display__detail-item">
              <div className="speed-display__detail-label">Trajectory</div>
              <div className="speed-display__detail-value">
                {result.trajectoryPoints.length} points
              </div>
            </div>

            {/* Confidence Description */}
            <div className="speed-display__detail-item speed-display__detail-item--full">
              <div className="speed-display__detail-description">
                {confidenceInfo.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {hasWarnings && (
        <div className="speed-display__warnings" role="alert" aria-live="polite">
          <div className="speed-display__warnings-header">
            <span className="speed-display__warnings-icon" aria-hidden="true">⚠️</span>
            <span className="speed-display__warnings-title">Notices</span>
          </div>
          <div className="speed-display__warnings-list">
            {result.warnings!.map((warning, index) => (
              <div key={index} className="speed-display__warning-item">
                {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .speed-display {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          border-radius: 12px;
          color: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .speed-display[role="button"] {
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .speed-display[role="button"]:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
        }

        .speed-display[role="button"]:active {
          transform: translateY(0);
        }

        /* Main Speed Section */
        .speed-display__main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .speed-display__speed-container {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .speed-display__speed-value {
          font-size: 4.5rem;
          font-weight: 700;
          line-height: 1;
          background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .speed-display__speed-unit {
          font-size: 1.5rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.5rem;
        }

        .speed-display__confidence-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          min-width: 100px;
        }

        .speed-display__confidence-level {
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .speed-display__confidence-value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        /* Details Section */
        .speed-display__details {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 1rem;
        }

        .speed-display__detail-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .speed-display__detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .speed-display__detail-item--full {
          grid-column: 1 / -1;
        }

        .speed-display__detail-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
        }

        .speed-display__detail-value {
          font-size: 1.25rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .speed-display__quality-badge {
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.3);
        }

        .speed-display__detail-description {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          font-style: italic;
        }

        /* Warnings Section */
        .speed-display__warnings {
          background: rgba(255, 193, 7, 0.1);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 8px;
          padding: 1rem;
        }

        .speed-display__warnings-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .speed-display__warnings-icon {
          font-size: 1.25rem;
        }

        .speed-display__warnings-title {
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #FFC107;
        }

        .speed-display__warnings-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .speed-display__warning-item {
          font-size: 0.85rem;
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.9);
          padding-left: 1.5rem;
          position: relative;
        }

        .speed-display__warning-item::before {
          content: "•";
          position: absolute;
          left: 0.5rem;
          color: #FFC107;
        }

        /* Mobile Optimizations */
        @media (max-width: 640px) {
          .speed-display {
            padding: 1rem;
            gap: 1rem;
          }

          .speed-display__speed-value {
            font-size: 3.5rem;
          }

          .speed-display__speed-unit {
            font-size: 1.25rem;
          }

          .speed-display__confidence-badge {
            min-width: 85px;
            padding: 0.5rem 0.75rem;
          }

          .speed-display__confidence-level {
            font-size: 0.75rem;
          }

          .speed-display__confidence-value {
            font-size: 1.1rem;
          }

          .speed-display__detail-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .speed-display__detail-value {
            font-size: 1.1rem;
          }
        }

        /* Small Mobile (Portrait) */
        @media (max-width: 380px) {
          .speed-display__main {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .speed-display__speed-value {
            font-size: 3rem;
          }

          .speed-display__confidence-badge {
            align-self: flex-start;
          }

          .speed-display__detail-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Tablet and Desktop */
        @media (min-width: 768px) {
          .speed-display {
            padding: 2rem;
          }

          .speed-display__speed-value {
            font-size: 5.5rem;
          }

          .speed-display__detail-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .speed-display__detail-item--full {
            grid-column: 1 / -1;
          }
        }

        /* Dark mode support (if system prefers dark) */
        @media (prefers-color-scheme: dark) {
          .speed-display {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .speed-display {
            border: 2px solid white;
          }

          .speed-display__confidence-badge {
            border: 1px solid white;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .speed-display[role="button"] {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * CameraGuidance Component
 * 
 * Displays camera diagnostic information and provides actionable recommendations
 * to help users achieve optimal ball tracking performance.
 */

'use client';

import { useMemo } from 'react';
import type { CameraDiagnostics } from '../hooks/useCameraDiagnostics';
import { getCameraRecommendations } from '../hooks/useCameraDiagnostics';

export interface CameraGuidanceProps {
  /**
   * Current camera diagnostics
   */
  diagnostics: CameraDiagnostics;

  /**
   * Whether to show detailed technical info
   * @default false
   */
  showTechnicalDetails?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * CameraGuidance Component
 * 
 * Shows camera settings status and recommendations.
 */
export function CameraGuidance({
  diagnostics,
  showTechnicalDetails = false,
  className = '',
}: CameraGuidanceProps) {
  const recommendations = useMemo(
    () => getCameraRecommendations(diagnostics),
    [diagnostics]
  );

  const statusColor = useMemo(() => {
    if (!diagnostics.resolution) return 'text-gray-500';
    if (diagnostics.meetsRequirements) return 'text-green-600 dark:text-green-400';
    return 'text-amber-600 dark:text-amber-400';
  }, [diagnostics.meetsRequirements, diagnostics.resolution]);

  const statusIcon = useMemo(() => {
    if (!diagnostics.resolution) return '⏳';
    if (diagnostics.meetsRequirements) return '✓';
    return '⚠';
  }, [diagnostics.meetsRequirements, diagnostics.resolution]);

  if (!diagnostics.resolution) {
    return (
      <div
        className={`camera-guidance camera-guidance--loading ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="camera-guidance__header">
          <span className="camera-guidance__icon text-gray-500">⏳</span>
          <span className="camera-guidance__title text-gray-700 dark:text-gray-300">
            Initializing camera...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`camera-guidance ${className}`}
      role="region"
      aria-label="Camera settings and guidance"
    >
      {/* Status Header */}
      <div className="camera-guidance__header">
        <span className={`camera-guidance__icon ${statusColor}`} aria-hidden="true">
          {statusIcon}
        </span>
        <span className={`camera-guidance__title ${statusColor}`}>
          {diagnostics.meetsRequirements
            ? 'Camera Ready'
            : 'Camera Needs Adjustment'}
        </span>
      </div>

      {/* Technical Details */}
      {showTechnicalDetails && (
        <div className="camera-guidance__details" aria-label="Technical details">
          <div className="camera-guidance__detail-row">
            <span className="camera-guidance__label">Resolution:</span>
            <span className="camera-guidance__value">
              {diagnostics.resolution.width} × {diagnostics.resolution.height}
            </span>
          </div>
          
          {diagnostics.reportedFPS !== null && (
            <div className="camera-guidance__detail-row">
              <span className="camera-guidance__label">Reported FPS:</span>
              <span className="camera-guidance__value">
                {diagnostics.reportedFPS}
              </span>
            </div>
          )}
          
          {diagnostics.inferredFPS !== null && (
            <div className="camera-guidance__detail-row">
              <span className="camera-guidance__label">Effective FPS:</span>
              <span className={diagnostics.inferredFPS >= 30 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {diagnostics.inferredFPS}
              </span>
            </div>
          )}
          
          {diagnostics.exposureStatus !== 'unknown' && (
            <div className="camera-guidance__detail-row">
              <span className="camera-guidance__label">Exposure:</span>
              <span className={diagnostics.exposureStatus === 'good' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                {diagnostics.exposureStatus === 'good' ? 'Good' : 
                 diagnostics.exposureStatus === 'too-high' ? 'Too High' : 
                 diagnostics.exposureStatus === 'too-low' ? 'Too Low' : 'Unknown'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Requirement Issues */}
      {diagnostics.requirementIssues.length > 0 && (
        <div className="camera-guidance__issues" role="alert">
          <p className="camera-guidance__issues-title">Issues Detected:</p>
          <ul className="camera-guidance__issues-list">
            {diagnostics.requirementIssues.map((issue, index) => (
              <li key={index} className="camera-guidance__issue-item">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="camera-guidance__recommendations">
          <p className="camera-guidance__recommendations-title">Recommendations:</p>
          <ul className="camera-guidance__recommendations-list">
            {recommendations.map((rec, index) => (
              <li key={index} className="camera-guidance__recommendation-item">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .camera-guidance {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
        }

        @media (prefers-color-scheme: dark) {
          .camera-guidance {
            background: rgba(31, 41, 55, 0.95);
            border-color: #374151;
          }
        }

        .camera-guidance__header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .camera-guidance__icon {
          font-size: 18px;
          font-weight: bold;
        }

        .camera-guidance__title {
          font-weight: 600;
        }

        .camera-guidance__details {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        @media (prefers-color-scheme: dark) {
          .camera-guidance__details {
            border-top-color: #374151;
          }
        }

        .camera-guidance__detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          color: #6b7280;
        }

        @media (prefers-color-scheme: dark) {
          .camera-guidance__detail-row {
            color: #9ca3af;
          }
        }

        .camera-guidance__label {
          font-weight: 500;
        }

        .camera-guidance__value {
          font-family: 'Courier New', monospace;
        }

        .camera-guidance__issues,
        .camera-guidance__recommendations {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        @media (prefers-color-scheme: dark) {
          .camera-guidance__issues,
          .camera-guidance__recommendations {
            border-top-color: #374151;
          }
        }

        .camera-guidance__issues-title,
        .camera-guidance__recommendations-title {
          font-weight: 600;
          margin-bottom: 6px;
          color: #374151;
        }

        @media (prefers-color-scheme: dark) {
          .camera-guidance__issues-title,
          .camera-guidance__recommendations-title {
            color: #d1d5db;
          }
        }

        .camera-guidance__issues-list,
        .camera-guidance__recommendations-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .camera-guidance__issue-item,
        .camera-guidance__recommendation-item {
          padding: 4px 0;
          padding-left: 16px;
          position: relative;
          color: #4b5563;
        }

        @media (prefers-color-scheme: dark) {
          .camera-guidance__issue-item,
          .camera-guidance__recommendation-item {
            color: #9ca3af;
          }
        }

        .camera-guidance__issue-item::before {
          content: '•';
          position: absolute;
          left: 4px;
          color: #ef4444;
        }

        @media (prefers-color-scheme: dark) {
          .camera-guidance__issue-item::before {
            color: #f87171;
          }
        }

        .camera-guidance__recommendation-item::before {
          content: '→';
          position: absolute;
          left: 4px;
          color: #3b82f6;
        }

        @media (prefers-color-scheme: dark) {
          .camera-guidance__recommendation-item::before {
            color: #60a5fa;
          }
        }
      `}</style>
    </div>
  );
}

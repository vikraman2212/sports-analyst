/**
 * ExportButton Component
 * 
 * Provides UI controls for exporting delivery analysis results to JSON.
 * Supports download, clipboard copy, and native share (when available).
 */

'use client';

import { useState } from 'react';
import type { DeliveryResult, CalibrationProfile } from '../lib/types';
import {
  downloadDeliveryJSON,
  copyDeliveryJSON,
  shareDeliveryJSON,
  isShareSupported,
  isClipboardSupported,
} from '../lib/export/jsonExport';

export interface ExportButtonProps {
  /**
   * Delivery result to export
   */
  result: DeliveryResult;

  /**
   * Optional calibration profile to include in export
   */
  calibration?: CalibrationProfile;

  /**
   * Button style variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'minimal';

  /**
   * Button size
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Whether to show icon only (no text)
   * @default false
   */
  iconOnly?: boolean;

  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * Callback after successful export
   */
  onExportSuccess?: (method: 'download' | 'copy' | 'share') => void;

  /**
   * Callback when export fails
   */
  onExportError?: (error: string) => void;
}

/**
 * ExportButton Component
 * 
 * Responsive export button with multiple export options.
 */
export function ExportButton({
  result,
  calibration,
  variant = 'primary',
  size = 'medium',
  iconOnly = false,
  className = '',
  onExportSuccess,
  onExportError,
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const shareSupported = isShareSupported();
  const clipboardSupported = isClipboardSupported();

  /**
   * Handle download action
   */
  const handleDownload = async () => {
    setIsExporting(true);
    setFeedback(null);

    try {
      downloadDeliveryJSON(result, calibration);
      setFeedback('Downloaded successfully!');
      onExportSuccess?.('download');

      setTimeout(() => {
        setFeedback(null);
        setShowMenu(false);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      setFeedback(`Error: ${errorMessage}`);
      onExportError?.(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Handle copy to clipboard action
   */
  const handleCopy = async () => {
    if (!clipboardSupported) {
      setFeedback('Clipboard not supported');
      return;
    }

    setIsExporting(true);
    setFeedback(null);

    try {
      await copyDeliveryJSON(result, calibration);
      setFeedback('Copied to clipboard!');
      onExportSuccess?.('copy');

      setTimeout(() => {
        setFeedback(null);
        setShowMenu(false);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Copy failed';
      setFeedback(`Error: ${errorMessage}`);
      onExportError?.(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Handle native share action
   */
  const handleShare = async () => {
    if (!shareSupported) {
      setFeedback('Share not supported');
      return;
    }

    setIsExporting(true);
    setFeedback(null);

    try {
      await shareDeliveryJSON(result, calibration);
      setFeedback('Shared successfully!');
      onExportSuccess?.('share');

      setTimeout(() => {
        setFeedback(null);
        setShowMenu(false);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Share failed';
      
      // User cancelled share - don't show error
      if (errorMessage.includes('AbortError') || errorMessage.includes('cancel')) {
        setFeedback(null);
      } else {
        setFeedback(`Error: ${errorMessage}`);
        onExportError?.(errorMessage);
      }
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Toggle export menu
   */
  const toggleMenu = () => {
    setShowMenu(!showMenu);
    setFeedback(null);
  };

  return (
    <div className={`export-button ${className}`}>
      {/* Main Button */}
      <button
        onClick={toggleMenu}
        className={`export-button__trigger export-button__trigger--${variant} export-button__trigger--${size}`}
        disabled={isExporting}
        aria-label="Export delivery data"
        aria-expanded={showMenu}
        aria-haspopup="menu"
      >
        <span className="export-button__icon" aria-hidden="true">
          📥
        </span>
        {!iconOnly && (
          <span className="export-button__text">Export</span>
        )}
      </button>

      {/* Export Menu */}
      {showMenu && (
        <div 
          className="export-button__menu" 
          role="menu"
          aria-label="Export options"
        >
          {/* Download Option */}
          <button
            onClick={handleDownload}
            className="export-button__menu-item"
            disabled={isExporting}
            role="menuitem"
            aria-label="Download JSON file"
          >
            <span className="export-button__menu-icon" aria-hidden="true">
              💾
            </span>
            <span className="export-button__menu-text">Download JSON</span>
          </button>

          {/* Copy Option */}
          {clipboardSupported && (
            <button
              onClick={handleCopy}
              className="export-button__menu-item"
              disabled={isExporting}
              role="menuitem"
              aria-label="Copy JSON to clipboard"
            >
              <span className="export-button__menu-icon" aria-hidden="true">
                📋
              </span>
              <span className="export-button__menu-text">Copy to Clipboard</span>
            </button>
          )}

          {/* Share Option */}
          {shareSupported && (
            <button
              onClick={handleShare}
              className="export-button__menu-item"
              disabled={isExporting}
              role="menuitem"
              aria-label="Share JSON file"
            >
              <span className="export-button__menu-icon" aria-hidden="true">
                🔗
              </span>
              <span className="export-button__menu-text">Share</span>
            </button>
          )}

          {/* Feedback Message */}
          {feedback && (
            <div 
              className={`export-button__feedback ${feedback.startsWith('Error') ? 'export-button__feedback--error' : 'export-button__feedback--success'}`}
              role="status"
              aria-live="polite"
            >
              {feedback}
            </div>
          )}
        </div>
      )}

      {/* Overlay to close menu */}
      {showMenu && (
        <div
          className="export-button__overlay"
          onClick={() => setShowMenu(false)}
          aria-hidden="true"
        />
      )}

      <style jsx>{`
        .export-button {
          position: relative;
          display: inline-block;
        }

        /* Trigger Button Styles */
        .export-button__trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1rem;
        }

        .export-button__trigger:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Variant Styles */
        .export-button__trigger--primary {
          background: #2563eb;
          color: white;
        }

        .export-button__trigger--primary:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .export-button__trigger--secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .export-button__trigger--secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }

        .export-button__trigger--minimal {
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          padding: 0.5rem;
        }

        .export-button__trigger--minimal:hover:not(:disabled) {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        /* Size Variants */
        .export-button__trigger--small {
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }

        .export-button__trigger--large {
          padding: 1rem 1.5rem;
          font-size: 1.125rem;
        }

        .export-button__icon {
          font-size: 1.25em;
        }

        /* Menu Styles */
        .export-button__menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          min-width: 200px;
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          padding: 0.5rem;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .export-button__menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 0.9rem;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .export-button__menu-item:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
        }

        .export-button__menu-item:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .export-button__menu-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .export-button__menu-text {
          flex: 1;
        }

        /* Feedback Styles */
        .export-button__feedback {
          padding: 0.75rem 1rem;
          margin-top: 0.25rem;
          border-radius: 6px;
          font-size: 0.85rem;
          text-align: center;
        }

        .export-button__feedback--success {
          background: rgba(0, 200, 83, 0.2);
          border: 1px solid rgba(0, 200, 83, 0.4);
          color: #00c853;
        }

        .export-button__feedback--error {
          background: rgba(211, 47, 47, 0.2);
          border: 1px solid rgba(211, 47, 47, 0.4);
          color: #d32f2f;
        }

        /* Overlay */
        .export-button__overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
          background: transparent;
        }

        /* Mobile Optimizations */
        @media (max-width: 640px) {
          .export-button__menu {
            left: 0;
            right: 0;
            bottom: 0;
            top: auto;
            border-radius: 16px 16px 0 0;
            min-width: auto;
          }

          .export-button__menu-item {
            padding: 1rem 1.25rem;
            font-size: 1rem;
          }

          .export-button__overlay {
            background: rgba(0, 0, 0, 0.5);
          }
        }

        /* High Contrast Mode */
        @media (prefers-contrast: high) {
          .export-button__trigger {
            border: 2px solid currentColor;
          }

          .export-button__menu {
            border: 2px solid white;
          }
        }

        /* Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .export-button__trigger,
          .export-button__menu-item {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

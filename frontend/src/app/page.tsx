/**
 * Cricket Ball Speed Tracker - Main Page
 * 
 * Integrates camera capture, ball detection, and speed analysis
 * into a single-page application.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { CameraView } from '@/components/CameraView';
import { SpeedDisplay } from '@/components/SpeedDisplay';
import { createCricketPitchCalibration, createPitchCalibration } from '@/lib/calibration';
import { PitchLengthSelector } from '@/components/PitchLengthSelector';
import { BallWeightSelector } from '@/components/BallWeightSelector';
import { usePitchLength } from '@/hooks/usePitchLength';
import { useBallWeight } from '@/hooks/useBallWeight';
import type { DeliveryResult } from '@/lib/types';

/**
 * Default calibration for prototype
 * Assumes 640px video width with pitch occupying ~80% of frame
 */
const DEFAULT_PITCH_LENGTH_PIXELS = 512;

export default function Home() {
  const [currentResult, setCurrentResult] = useState<DeliveryResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { state: pitchState } = usePitchLength();
  const { state: ballWeightState } = useBallWeight();

  // Create default calibration (memoized to avoid recreating on every render)
  const calibration = useMemo(() => {
    // Standard uses default helper; others use explicit meters
    if (pitchState.meters === 20.12) {
      return createCricketPitchCalibration(DEFAULT_PITCH_LENGTH_PIXELS, ballWeightState.grams);
    }
    return createPitchCalibration(DEFAULT_PITCH_LENGTH_PIXELS, pitchState.meters, ballWeightState.grams);
  }, [pitchState.meters, ballWeightState.grams]);

  const pitchLabel = useMemo(() => (
    pitchState.meters === 20.12 ? 'Standard' : (pitchState.meters === 16 ? 'Youth' : 'Custom')
  ), [pitchState.meters]);

  /**
   * Handle successful delivery analysis
   */
  const handleAnalysisComplete = useCallback((result: DeliveryResult) => {
    setCurrentResult(result);
    setIsRecording(false);
    setError(null);
  }, []);

  /**
   * Handle analysis error
   */
  const handleAnalysisError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsRecording(false);
    setCurrentResult(null);
  }, []);

  /**
   * Handle recording start
   */
  const handleRecordingStart = useCallback(() => {
    setIsRecording(true);
    setCurrentResult(null);
    setError(null);
  }, []);

  /**
   * Handle recording stop
   */
  const handleRecordingStop = useCallback(() => {
    setIsRecording(false);
  }, []);

  /**
   * Reset to initial state
   */
  const handleReset = useCallback(() => {
    setCurrentResult(null);
    setIsRecording(false);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🏏 Cricket Ball Speed Tracker
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Real-time ball tracking and speed analysis
              </p>
            </div>
            {currentResult && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                aria-label="Reset and start new delivery"
              >
                New Delivery
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera View Section */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Camera Feed
              </h2>
              {/* Config selectors */}
              <div className="mb-4 space-y-3">
                <PitchLengthSelector />
                <BallWeightSelector />
              </div>
              <CameraView
                calibration={calibration}
                onAnalysisComplete={handleAnalysisComplete}
                onAnalysisError={handleAnalysisError}
                onRecordingStart={handleRecordingStart}
                onRecordingStop={handleRecordingStop}
              />
            </div>

            {/* Instructions Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                📋 Instructions
              </h3>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Allow camera access when prompted</li>
                <li>Position camera to view the pitch</li>
                <li>Click &quot;Start Recording&quot; before the delivery</li>
                <li>Click &quot;Stop & Analyze&quot; after ball reaches batter</li>
                <li>View speed and trajectory results</li>
              </ol>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Analysis Results
              </h2>
              
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    ⚠️ Error: {error}
                  </p>
                </div>
              )}

              {/* Recording Indicator */}
              {isRecording && !currentResult && !error && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    🎥 Recording in progress... Click &quot;Stop & Analyze&quot; when ready
                  </p>
                </div>
              )}

              {/* Speed Display */}
              <SpeedDisplay
                result={currentResult}
                showDetails={true}
                showWarnings={true}
                pitchMeters={pitchState.meters}
                pitchLabel={pitchLabel}
              />
            </div>

            {/* Calibration Info Card */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                ⚙️ Calibration Settings
              </h3>
              <dl className="text-sm space-y-1">
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Mode:</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">
                    {pitchState.meters === 20.12 ? 'Standard (22-yard pitch)' : (pitchState.meters === 16 ? 'Youth (16m)' : 'Custom')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Pitch Length:</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">
                    {DEFAULT_PITCH_LENGTH_PIXELS}px
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600 dark:text-gray-400">Reference:</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">
                    {pitchState.meters}m {pitchState.meters === 20.12 ? '(Cricket Standard)' : ''}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                ℹ️ You can change pitch length presets above. Your selection is saved on this device.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Cricket Ball Speed Tracker - Built with Next.js, React, and ONNX Runtime
          </p>
        </div>
      </footer>
    </div>
  );
}

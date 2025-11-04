/**
 * CameraCapabilitiesDebugger Component
 * 
 * Deep dive into camera capabilities to find workarounds for FPS limitations
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

interface CapabilityTest {
  name: string;
  status: 'pending' | 'success' | 'failed';
  result?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
}

export function CameraCapabilitiesDebugger() {
  const [tests, setTests] = useState<CapabilityTest[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (name: string, update: Partial<CapabilityTest>) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, ...update } : t);
      }
      return [...prev, { name, status: 'pending', ...update }];
    });
  };

  const runTests = useCallback(async () => {
    setIsRunning(true);
    setTests([]);

    try {
      // Test 1: Basic getUserMedia with 60 FPS
      updateTest('Basic 60 FPS Request', { status: 'pending' });
      try {
        const stream1 = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 60 },
            facingMode: 'environment'
          }
        });
        const track = stream1.getVideoTracks()[0];
        const settings = track.getSettings();
        updateTest('Basic 60 FPS Request', {
          status: settings.frameRate === 60 ? 'success' : 'failed',
          result: `Got ${settings.frameRate} FPS`,
          details: settings
        });
        stream1.getTracks().forEach(t => t.stop());
      } catch (err) {
        updateTest('Basic 60 FPS Request', {
          status: 'failed',
          result: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 2: Exact 60 FPS constraint
      updateTest('Exact 60 FPS Constraint', { status: 'pending' });
      try {
        const stream2 = await navigator.mediaDevices.getUserMedia({
          video: {
            frameRate: { exact: 60 },
            facingMode: 'environment'
          }
        });
        const track = stream2.getVideoTracks()[0];
        const settings = track.getSettings();
        updateTest('Exact 60 FPS Constraint', {
          status: 'success',
          result: `Got ${settings.frameRate} FPS`,
          details: settings
        });
        stream2.getTracks().forEach(t => t.stop());
      } catch (err) {
        updateTest('Exact 60 FPS Constraint', {
          status: 'failed',
          result: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 3: Get camera capabilities
      updateTest('Camera Capabilities', { status: 'pending' });
      try {
        const stream3 = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        const track = stream3.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        updateTest('Camera Capabilities', {
          status: 'success',
          result: `frameRate: ${JSON.stringify(capabilities.frameRate)}`,
          details: capabilities
        });
        setStream(stream3); // Keep this one for further testing
      } catch (err) {
        updateTest('Camera Capabilities', {
          status: 'failed',
          result: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 4: ImageCapture API (alternative approach)
      updateTest('ImageCapture API', { status: 'pending' });
      try {
        if ('ImageCapture' in window && stream) {
          const track = stream.getVideoTracks()[0];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const imageCapture = new (window as any).ImageCapture(track);
          const photoCapabilities = await imageCapture.getPhotoCapabilities();
          updateTest('ImageCapture API', {
            status: 'success',
            result: 'Available',
            details: photoCapabilities
          });
        } else {
          updateTest('ImageCapture API', {
            status: 'failed',
            result: 'Not supported'
          });
        }
      } catch (err) {
        updateTest('ImageCapture API', {
          status: 'failed',
          result: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 5: Try applying 60 FPS constraint to existing stream
      updateTest('Apply 60 FPS to Stream', { status: 'pending' });
      if (stream) {
        try {
          const track = stream.getVideoTracks()[0];
          const beforeSettings = track.getSettings();
          
          await track.applyConstraints({
            frameRate: { exact: 60 }
          });
          
          const afterSettings = track.getSettings();
          updateTest('Apply 60 FPS to Stream', {
            status: afterSettings.frameRate === 60 ? 'success' : 'failed',
            result: `Before: ${beforeSettings.frameRate} FPS → After: ${afterSettings.frameRate} FPS`,
            details: { before: beforeSettings, after: afterSettings }
          });
        } catch (err) {
          updateTest('Apply 60 FPS to Stream', {
            status: 'failed',
            result: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }

      // Test 6: Advanced constraints structure
      updateTest('Advanced Constraints', { status: 'pending' });
      try {
        const stream6 = await navigator.mediaDevices.getUserMedia({
          video: {
            advanced: [
              {
                frameRate: { exact: 60 },
                width: { exact: 1920 },
                height: { exact: 1080 }
              }
            ],
            facingMode: 'environment'
          }
        });
        const track = stream6.getVideoTracks()[0];
        const settings = track.getSettings();
        updateTest('Advanced Constraints', {
          status: settings.frameRate === 60 ? 'success' : 'failed',
          result: `Got ${settings.frameRate} FPS`,
          details: settings
        });
        stream6.getTracks().forEach(t => t.stop());
      } catch (err) {
        updateTest('Advanced Constraints', {
          status: 'failed',
          result: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 7: Check all available devices
      updateTest('Available Devices', { status: 'pending' });
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');
        updateTest('Available Devices', {
          status: 'success',
          result: `Found ${cameras.length} camera(s)`,
          details: cameras
        });
      } catch (err) {
        updateTest('Available Devices', {
          status: 'failed',
          result: err instanceof Error ? err.message : 'Unknown error'
        });
      }

    } catch (err) {
      console.error('Test suite error:', err);
    } finally {
      setIsRunning(false);
    }
  }, [stream]);

  const cleanup = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Camera Capabilities Debugger</h1>
        <p className="text-gray-400 mb-6">
          Testing various methods to achieve 60 FPS on your device
        </p>

        <div className="flex gap-3 mb-6">
          <button
            onClick={runTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded font-medium transition-colors"
          >
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </button>
          <button
            onClick={cleanup}
            disabled={!stream}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded font-medium transition-colors"
          >
            Cleanup
          </button>
        </div>

        <div className="space-y-3">
          {tests.map((test, idx) => (
            <div
              key={idx}
              className={`p-4 rounded border ${
                test.status === 'success'
                  ? 'bg-green-900/20 border-green-500/50'
                  : test.status === 'failed'
                  ? 'bg-red-900/20 border-red-500/50'
                  : 'bg-gray-800 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{test.name}</h3>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    test.status === 'success'
                      ? 'bg-green-600'
                      : test.status === 'failed'
                      ? 'bg-red-600'
                      : 'bg-yellow-600'
                  }`}
                >
                  {test.status}
                </span>
              </div>
              {test.result && (
                <p className="text-sm text-gray-300 mb-2">{test.result}</p>
              )}
              {test.details && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
                    View Details
                  </summary>
                  <pre className="mt-2 p-2 bg-black/50 rounded overflow-auto max-h-48">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {tests.length === 0 && !isRunning && (
          <div className="text-center text-gray-400 py-12">
            Click &quot;Run Tests&quot; to start diagnostics
          </div>
        )}
      </div>
    </div>
  );
}

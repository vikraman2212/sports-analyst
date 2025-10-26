/**
 * Unit tests for ONNX Runtime detector
 * 
 * Note: Creating simplified test file with proper tensor mocks
 */

import { ONNXRuntimeDetector, createDetector } from '../../lib/detection/onnxRuntime';
import type { FrameSample } from '../../lib/types';
import * as ort from 'onnxruntime-web';

// Mock ONNX Runtime
jest.mock('onnxruntime-web');

// Helper to create mock tensor-like object
const createMockTensor = (data: Float32Array, dims: number[]) => ({
  data,
  dims,
  type: 'float32',
});

describe('ONNXRuntimeDetector - Simple Tests', () => {
  let detector: ONNXRuntimeDetector;
  const mockSession = {
    run: jest.fn(),
    release: jest.fn(),
  };

  const createMockFrame = (width = 640, height = 640, frameIndex = 0): FrameSample => ({
    frameIndex,
    timestampMs: Date.now(),
    imageData: new ImageData(width, height),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock InferenceSession.create
    (ort.InferenceSession.create as jest.Mock) = jest
      .fn()
      .mockResolvedValue(mockSession);

    detector = new ONNXRuntimeDetector({
      confidenceThreshold: 0.5,
    });
  });

  describe('Initialization', () => {
    it('should initialize with default config', async () => {
      await detector.initialize();

      expect(ort.InferenceSession.create).toHaveBeenCalledWith(
        '/model.onnx',
        expect.objectContaining({
          executionProviders: ['webgl', 'wasm'],
        })
      );
    });
  });

  describe('Detection', () => {
    beforeEach(async () => {
      await detector.initialize();

      // Mock preprocessFrame to avoid canvas issues in jsdom
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jest.spyOn(detector as any, 'preprocessFrame').mockImplementation(() => {
        return createMockTensor(new Float32Array(3 * 640 * 640), [1, 3, 640, 640]);
      });
    });

    it('should detect ball with valid output', async () => {
      const mockTensor = createMockTensor(
        new Float32Array([100, 150, 50, 50, 0.85, 0]),
        [1, 6]
      );

      mockSession.run.mockResolvedValue({ output: mockTensor });

      const detection = await detector.detect(createMockFrame());

      expect(detection).toEqual({
        boundingBox: { x: 100, y: 150, width: 50, height: 50 },
        confidence: 0.85,
        ballClass: 'cricket_ball',
      });
    });

    it('should return null for low confidence', async () => {
      const mockTensor = createMockTensor(
        new Float32Array([100, 150, 50, 50, 0.3, 0]),
        [1, 6]
      );

      mockSession.run.mockResolvedValue({ output: mockTensor });

      const detection = await detector.detect(createMockFrame());

      expect(detection).toBeNull();
    });

    it('should return highest confidence detection', async () => {
      const mockTensor = createMockTensor(
        new Float32Array([
          100, 150, 50, 50, 0.75, 0,
          200, 250, 40, 40, 0.90, 0,
          300, 350, 45, 45, 0.60, 0,
        ]),
        [3, 6]
      );

      mockSession.run.mockResolvedValue({ output: mockTensor });

      const detection = await detector.detect(createMockFrame());

      expect(detection).toEqual({
        boundingBox: { x: 200, y: 250, width: 40, height: 40 },
        confidence: 0.90,
        ballClass: 'cricket_ball',
      });
    });

    it('should handle inference errors', async () => {
      mockSession.run.mockRejectedValue(new Error('Inference failed'));

      const detection = await detector.detect(createMockFrame());

      expect(detection).toBeNull();
    });
  });

  describe('Disposal', () => {
    it('should release session on dispose', async () => {
      await detector.initialize();
      await detector.dispose();

      expect(mockSession.release).toHaveBeenCalled();
    });
  });

  describe('createDetector fallback', () => {
    it('should fall back to MockDetector when ONNX fails', async () => {
      (ort.InferenceSession.create as jest.Mock).mockRejectedValue(
        new Error('Model not found')
      );

      const detector = await createDetector({ confidenceThreshold: 0.5 });

      expect(detector.constructor.name).toBe('MockDetector');
    });
  });
});

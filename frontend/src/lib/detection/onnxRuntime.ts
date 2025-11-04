/**
 * ONNX Runtime Detector
 * 
 * Production ball detector using ONNX Runtime Web.
 * Loads trained model and performs real-time inference on video frames.
 * 
 * Model Input: RGB image tensor [1, 3, H, W]
 * Model Output: Detections [N, 6] where each row is [x, y, w, h, confidence, class]
 * 
 * NOTE: This implementation assumes a model is available at /public/model.onnx
 * For development without a trained model, use MockDetector instead.
 */

import * as ort from 'onnxruntime-web';
import type { FrameSample, Detection } from '../types';
import type { IDetector, DetectorConfig } from './types';

/**
 * ONNX Runtime configuration
 */
export interface ONNXRuntimeConfig extends Omit<DetectorConfig, 'backend'> {
  /**
   * Path to ONNX model file (default: /model.onnx)
   */
  modelPath?: string;

  /**
   * Input image dimensions expected by model
   * @default { width: 640, height: 640 }
   */
  inputDimensions?: {
    width: number;
    height: number;
  };

  /**
   * Whether to use GPU acceleration (WebGL backend)
   * @default true
   */
  useGPU?: boolean;

  /**
   * Maximum number of detections to return
   * @default 10
   */
  maxDetections?: number;
}

/**
 * ONNX Runtime detector for production use
 */
export class ONNXRuntimeDetector implements IDetector {
  private config: ONNXRuntimeConfig;
  private session: ort.InferenceSession | null = null;
  private initialized = false;

  constructor(config: ONNXRuntimeConfig) {
    this.config = {
      modelPath: '/model.onnx',
      inputDimensions: { width: 640, height: 640 },
      useGPU: true,
      maxDetections: 10,
      confidenceThreshold: 0.5,
      ...config,
    };
  }

  /**
   * Initialize ONNX Runtime session and load model
   */
  async initialize(): Promise<void> {
    try {
      // Set execution providers (GPU if available)
      const executionProviders = this.config.useGPU
        ? ['webgl', 'wasm']
        : ['wasm'];

      // Create inference session
      this.session = await ort.InferenceSession.create(
        this.config.modelPath!,
        {
          executionProviders,
          graphOptimizationLevel: 'all',
        }
      );

      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize ONNX Runtime: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Detect ball in a single frame
   */
  async detect(frame: FrameSample): Promise<Detection | null> {
    if (!this.initialized || !this.session) {
      throw new Error('Detector not initialized. Call initialize() first.');
    }

    try {
      // Preprocess frame
      const inputTensor = this.preprocessFrame(frame);

      // Run inference
      const outputs = await this.session.run({ input: inputTensor });

      // Postprocess results
      const detections = this.postprocessOutputs(outputs, frame);

      // Return best detection (highest confidence)
      return detections.length > 0 ? detections[0] : null;
    } catch (error) {
      console.error('ONNX inference error:', error);
      return null;
    }
  }

  /**
   * Detect ball in multiple frames (batch processing)
   */
  async detectBatch(frames: FrameSample[]): Promise<(Detection | null)[]> {
    // Process frames individually (batching requires model support)
    const results: (Detection | null)[] = [];

    for (const frame of frames) {
      const detection = await this.detect(frame);
      results.push(detection);
    }

    return results;
  }

  /**
   * Preprocess frame for model input
   * Converts ImageData to normalized tensor [1, 3, H, W]
   */
  private preprocessFrame(frame: FrameSample): ort.Tensor {
    const { width, height } = this.config.inputDimensions!;
    const { imageData } = frame;

    // Create canvas for resizing
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Draw and resize image
    ctx.drawImage(
      this.imageDataToCanvas(imageData),
      0,
      0,
      imageData.width,
      imageData.height,
      0,
      0,
      width,
      height
    );

    // Get resized image data
    const resizedData = ctx.getImageData(0, 0, width, height);

    // Convert to normalized float32 tensor [1, 3, H, W]
    // RGBA -> RGB, normalize to [0, 1], transpose to CHW format
    const float32Data = new Float32Array(3 * width * height);

    for (let i = 0; i < width * height; i++) {
      const pixelIndex = i * 4; // RGBA stride

      // Red channel
      float32Data[i] = resizedData.data[pixelIndex] / 255.0;

      // Green channel
      float32Data[width * height + i] = resizedData.data[pixelIndex + 1] / 255.0;

      // Blue channel
      float32Data[2 * width * height + i] = resizedData.data[pixelIndex + 2] / 255.0;
    }

    // Create tensor with shape [1, 3, H, W]
    return new ort.Tensor('float32', float32Data, [1, 3, height, width]);
  }

  /**
   * Convert ImageData to Canvas for preprocessing
   */
  private imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  /**
   * Postprocess model outputs to Detection objects
   * 
   * Expected output format: [N, 6] where each row is [x, y, w, h, confidence, class]
   * Or: { boxes: [N, 4], scores: [N], classes: [N] }
   */
  private postprocessOutputs(
    outputs: ort.InferenceSession.OnnxValueMapType,
    frame: FrameSample
  ): Detection[] {
    // Get output tensor (name may vary by model)
    const outputTensor = Object.values(outputs)[0] as ort.Tensor;
    const outputData = outputTensor.data as Float32Array;

    const detections: Detection[] = [];

    // Parse detections based on output shape
    // Assuming [N, 6] format: [x, y, w, h, confidence, class]
    if (outputTensor.dims.length === 2 && outputTensor.dims[1] === 6) {
      const numDetections = outputTensor.dims[0];

      for (let i = 0; i < numDetections; i++) {
        const offset = i * 6;
        const x = outputData[offset];
        const y = outputData[offset + 1];
        const w = outputData[offset + 2];
        const h = outputData[offset + 3];
        const confidence = outputData[offset + 4];
        const classId = outputData[offset + 5];

        // Apply confidence threshold
        if (confidence < this.config.confidenceThreshold!) {
          continue;
        }

        // Scale coordinates back to original frame dimensions
        const { width: inputW, height: inputH } = this.config.inputDimensions!;
        const scaleX = frame.imageData.width / inputW;
        const scaleY = frame.imageData.height / inputH;

        detections.push({
          boundingBox: {
            x: Math.round(x * scaleX),
            y: Math.round(y * scaleY),
            width: Math.round(w * scaleX),
            height: Math.round(h * scaleY),
          },
          confidence: Math.round(confidence * 100) / 100,
          ballClass: classId === 0 ? 'cricket_ball' : `class_${classId}`,
        });
      }
    }

    // Sort by confidence (highest first)
    detections.sort((a, b) => b.confidence - a.confidence);

    // Return top N detections
    return detections.slice(0, this.config.maxDetections);
  }

  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    if (this.session) {
      await this.session.release();
      this.session = null;
    }
    this.initialized = false;
  }
}

/**
 * Create detector instance based on environment
 * 
 * - Production: Use ONNX Runtime if model available
 * - Development: Fall back to MockDetector if model not found
 */
export async function createDetector(
  config: ONNXRuntimeConfig
): Promise<IDetector> {
  try {
    // Try to create ONNX detector
    const detector = new ONNXRuntimeDetector(config);
    await detector.initialize();
    return detector;
  } catch (error) {
    console.warn('ONNX Runtime initialization failed, using MockDetector:', error);

    // Fall back to mock detector
    const { MockDetector } = await import('./mockDetector');
    const mockDetector = new MockDetector({
      backend: 'mock' as const,
      confidenceThreshold: config.confidenceThreshold,
      maxDetections: config.maxDetections,
    });
    await mockDetector.initialize();
    return mockDetector;
  }
}

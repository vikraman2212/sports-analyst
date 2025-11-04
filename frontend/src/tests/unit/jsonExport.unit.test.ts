/**
 * Unit Tests for JSON Export Utility
 * 
 * Tests delivery data export, import, and sharing functionality.
 */

import {
  exportDeliveryToJSON,
  deliveryToJSONString,
  downloadDeliveryJSON,
  copyDeliveryJSON,
  shareDeliveryJSON,
  importDeliveryFromJSON,
  isShareSupported,
  isClipboardSupported,
} from '../../lib/export/jsonExport';
import type { DeliveryResult, TrajectoryPoint } from '../../lib/types';
import { createMockCalibration } from '../testHelpers';

describe('JSON Export Utility', () => {
  // Sample test data
  const sampleTrajectory: TrajectoryPoint[] = [
    { pixelX: 100, pixelY: 100, estimatedZ: null, timestampMs: 0 },
    { pixelX: 150, pixelY: 120, estimatedZ: 5.2, timestampMs: 167 },
    { pixelX: 200, pixelY: 140, estimatedZ: 10.5, timestampMs: 333 },
  ];

  const sampleResult: DeliveryResult = {
    speedKmh: 135.5,
    confidence: 0.92,
    detectionCount: 18,
    processingMs: 842,
    trajectoryPoints: sampleTrajectory,
    warnings: ['Low lighting detected'],
  };

  const sampleCalibration = createMockCalibration({
    pitchLengthPixels: 512,
  });

  describe('exportDeliveryToJSON', () => {
    it('should export delivery result to JSON object', () => {
      const exported = exportDeliveryToJSON(sampleResult);

      expect(exported).toHaveProperty('metadata');
      expect(exported).toHaveProperty('delivery');
      expect(exported).toHaveProperty('trajectory');
      expect(exported).toHaveProperty('statistics');
    });

    it('should include correct metadata', () => {
      const exported = exportDeliveryToJSON(sampleResult);

      expect(exported.metadata.version).toBe('1.0.0');
      expect(exported.metadata.appName).toBe('Cricket Ball Speed Tracker');
      expect(exported.metadata.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    });

    it('should include delivery data', () => {
      const exported = exportDeliveryToJSON(sampleResult);

      expect(exported.delivery.speedKmh).toBe(135.5);
      expect(exported.delivery.confidence).toBe(0.92);
      expect(exported.delivery.detectionCount).toBe(18);
      expect(exported.delivery.processingMs).toBe(842);
      expect(exported.delivery.warnings).toEqual(['Low lighting detected']);
    });

    it('should include trajectory data', () => {
      const exported = exportDeliveryToJSON(sampleResult);

      expect(exported.trajectory.totalPoints).toBe(3);
      expect(exported.trajectory.durationMs).toBe(333); // 333 - 0
      expect(exported.trajectory.points).toHaveLength(3);
      expect(exported.trajectory.points[0]).toEqual({
        timestampMs: 0,
        pixelX: 100,
        pixelY: 100,
        estimatedZ: null,
      });
    });

    it('should include statistics', () => {
      const exported = exportDeliveryToJSON(sampleResult);

      expect(exported.statistics).toBeDefined();
      expect(exported.statistics?.avgConfidence).toBe(0.92);
      expect(exported.statistics?.trajectoryDuration).toBe(333);
      expect(exported.statistics?.estimatedDistancePixels).toBeGreaterThan(0);
    });

    it('should include calibration when provided', () => {
      const exported = exportDeliveryToJSON(sampleResult, sampleCalibration);

      expect(exported.calibration).toBeDefined();
      expect(exported.calibration?.pitchLengthPixels).toBe(512);
      expect(exported.calibration?.referenceDistanceMeters).toBe(20.12);
      expect(exported.calibration?.hasHomography).toBe(false);
    });

    it('should not include calibration when not provided', () => {
      const exported = exportDeliveryToJSON(sampleResult);

      expect(exported.calibration).toBeUndefined();
    });

    it('should handle empty warnings', () => {
      const resultWithoutWarnings: DeliveryResult = {
        ...sampleResult,
        warnings: undefined,
      };

      const exported = exportDeliveryToJSON(resultWithoutWarnings);

      expect(exported.delivery.warnings).toBeUndefined();
    });

    it('should handle single trajectory point', () => {
      const singlePointResult: DeliveryResult = {
        ...sampleResult,
        trajectoryPoints: [{ pixelX: 100, pixelY: 100, estimatedZ: null, timestampMs: 0 }],
      };

      const exported = exportDeliveryToJSON(singlePointResult);

      expect(exported.trajectory.totalPoints).toBe(1);
      expect(exported.trajectory.durationMs).toBe(0);
      expect(exported.statistics?.estimatedDistancePixels).toBe(0);
    });

    it('should calculate trajectory distance correctly', () => {
      const exported = exportDeliveryToJSON(sampleResult);

      // Distance from (100,100) to (150,120) = sqrt(2500+400) = ~53.85
      // Distance from (150,120) to (200,140) = sqrt(2500+400) = ~53.85
      // Total ≈ 107.7
      expect(exported.statistics?.estimatedDistancePixels).toBeCloseTo(107.7, 1);
    });
  });

  describe('deliveryToJSONString', () => {
    it('should convert to JSON string', () => {
      const jsonString = deliveryToJSONString(sampleResult);

      expect(typeof jsonString).toBe('string');
      expect(() => JSON.parse(jsonString)).not.toThrow();
    });

    it('should pretty-print by default', () => {
      const jsonString = deliveryToJSONString(sampleResult);

      expect(jsonString).toContain('\n');
      expect(jsonString).toContain('  '); // Indentation
    });

    it('should support compact format', () => {
      const jsonString = deliveryToJSONString(sampleResult, undefined, false);

      expect(jsonString).not.toContain('\n');
    });

    it('should include calibration in JSON string', () => {
      const jsonString = deliveryToJSONString(sampleResult, sampleCalibration);

      expect(jsonString).toContain('"calibration"');
      expect(jsonString).toContain('512');
      expect(jsonString).toContain('20.12');
    });

    it('should produce parseable JSON', () => {
      const jsonString = deliveryToJSONString(sampleResult, sampleCalibration);
      const parsed = JSON.parse(jsonString);

      expect(parsed.delivery.speedKmh).toBe(135.5);
      expect(parsed.trajectory.totalPoints).toBe(3);
    });
  });

  describe('downloadDeliveryJSON', () => {
    let createElementSpy: jest.SpyInstance;
    let createObjectURLSpy: jest.Mock;
    let revokeObjectURLSpy: jest.Mock;

    beforeEach(() => {
      // Mock DOM APIs
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      } as unknown as HTMLAnchorElement;

      createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);

      // Mock URL API
      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      createObjectURLSpy = global.URL.createObjectURL as jest.Mock;
      revokeObjectURLSpy = global.URL.revokeObjectURL as jest.Mock;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create download link with blob', () => {
      downloadDeliveryJSON(sampleResult);

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(createElementSpy).toHaveBeenCalledWith('a');
    });

    it('should use auto-generated filename by default', () => {
      downloadDeliveryJSON(sampleResult);

      const mockLink = createElementSpy.mock.results[0].value;
      expect(mockLink.download).toMatch(/^cricket-delivery-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('should use custom filename when provided', () => {
      downloadDeliveryJSON(sampleResult, undefined, 'my-delivery.json');

      const mockLink = createElementSpy.mock.results[0].value;
      expect(mockLink.download).toBe('my-delivery.json');
    });

    it('should trigger download', () => {
      downloadDeliveryJSON(sampleResult);

      const mockLink = createElementSpy.mock.results[0].value;
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should cleanup resources', () => {
      downloadDeliveryJSON(sampleResult);

      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('copyDeliveryJSON', () => {
    let writeTextSpy: jest.SpyInstance;

    beforeEach(() => {
      writeTextSpy = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextSpy,
        },
      });
    });

    it('should copy JSON to clipboard', async () => {
      await copyDeliveryJSON(sampleResult);

      expect(writeTextSpy).toHaveBeenCalled();
      const copiedText = writeTextSpy.mock.calls[0][0];
      expect(() => JSON.parse(copiedText)).not.toThrow();
    });

    it('should include calibration data when provided', async () => {
      await copyDeliveryJSON(sampleResult, sampleCalibration);

      const copiedText = writeTextSpy.mock.calls[0][0];
      expect(copiedText).toContain('"calibration"');
    });

    it('should copy pretty-printed JSON', async () => {
      await copyDeliveryJSON(sampleResult);

      const copiedText = writeTextSpy.mock.calls[0][0];
      expect(copiedText).toContain('\n');
    });
  });

  describe('shareDeliveryJSON', () => {
    it('should throw error if Web Share API not supported', async () => {
      Object.assign(navigator, { share: undefined });

      await expect(shareDeliveryJSON(sampleResult)).rejects.toThrow(
        'Web Share API not supported'
      );
    });

    it('should call navigator.share with correct data', async () => {
      const shareSpy = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { share: shareSpy });

      await shareDeliveryJSON(sampleResult);

      expect(shareSpy).toHaveBeenCalled();
      const shareData = shareSpy.mock.calls[0][0];

      expect(shareData.title).toContain('135.5 km/h');
      expect(shareData.text).toContain('18 detections');
      expect(shareData.files).toHaveLength(1);
    });

    it('should create file with correct name', async () => {
      const shareSpy = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { share: shareSpy });

      await shareDeliveryJSON(sampleResult);

      const shareData = shareSpy.mock.calls[0][0];
      const file = shareData.files[0];

      expect(file.name).toMatch(/cricket-delivery-135\.5kmh\.json/);
      expect(file.type).toBe('application/json');
    });
  });

  describe('importDeliveryFromJSON', () => {
    it('should import valid JSON string', () => {
      const jsonString = deliveryToJSONString(sampleResult, sampleCalibration);
      const imported = importDeliveryFromJSON(jsonString);

      expect(imported.delivery.speedKmh).toBe(135.5);
      expect(imported.trajectory.totalPoints).toBe(3);
      expect(imported.calibration?.pitchLengthPixels).toBe(512);
    });

    it('should throw error for invalid JSON', () => {
      const invalidJSON = 'not valid json {';

      expect(() => importDeliveryFromJSON(invalidJSON)).toThrow('Invalid JSON format');
    });

    it('should throw error for missing required fields', () => {
      const invalidData = JSON.stringify({ metadata: {}, delivery: {} });

      expect(() => importDeliveryFromJSON(invalidData)).toThrow('missing required fields');
    });

    it('should throw error for invalid speedKmh type', () => {
      const invalidData = JSON.stringify({
        metadata: {},
        delivery: { speedKmh: 'not a number' },
        trajectory: { points: [] },
      });

      expect(() => importDeliveryFromJSON(invalidData)).toThrow('speedKmh must be a number');
    });

    it('should throw error for invalid trajectory points', () => {
      const invalidData = JSON.stringify({
        metadata: {},
        delivery: { speedKmh: 100 },
        trajectory: { points: 'not an array' },
      });

      expect(() => importDeliveryFromJSON(invalidData)).toThrow(
        'trajectory.points must be an array'
      );
    });

    it('should handle data without calibration', () => {
      const jsonString = deliveryToJSONString(sampleResult);
      const imported = importDeliveryFromJSON(jsonString);

      expect(imported.calibration).toBeUndefined();
    });

    it('should preserve all trajectory points', () => {
      const jsonString = deliveryToJSONString(sampleResult);
      const imported = importDeliveryFromJSON(jsonString);

      expect(imported.trajectory.points).toHaveLength(3);
      expect(imported.trajectory.points[0].pixelX).toBe(100);
      expect(imported.trajectory.points[1].estimatedZ).toBe(5.2);
    });
  });

  describe('isShareSupported', () => {
    it('should return true when Web Share API is available', () => {
      Object.assign(navigator, { share: jest.fn() });

      expect(isShareSupported()).toBe(true);
    });

    it('should return false when Web Share API is not available', () => {
      const originalShare = navigator.share;
      // @ts-expect-error - Testing missing share API
      delete navigator.share;

      expect(isShareSupported()).toBe(false);

      // Restore
      if (originalShare) {
        navigator.share = originalShare;
      }
    });

    it('should handle undefined navigator', () => {
      const originalNavigator = global.navigator;
      // @ts-expect-error - Testing undefined navigator
      delete global.navigator;

      expect(isShareSupported()).toBe(false);

      global.navigator = originalNavigator;
    });
  });

  describe('isClipboardSupported', () => {
    it('should return true when Clipboard API is available', () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn(),
        },
      });

      expect(isClipboardSupported()).toBe(true);
    });

    it('should return false when Clipboard API is not available', () => {
      const originalClipboard = navigator.clipboard;
      // @ts-expect-error - Testing missing clipboard API
      delete navigator.clipboard;

      expect(isClipboardSupported()).toBe(false);

      // Restore
      if (originalClipboard) {
        Object.defineProperty(navigator, 'clipboard', {
          value: originalClipboard,
          writable: true,
          configurable: true,
        });
      }
    });

    it('should return false when writeText is not available', () => {
      Object.assign(navigator, { clipboard: {} });

      expect(isClipboardSupported()).toBe(false);
    });

    it('should handle undefined navigator', () => {
      const originalNavigator = global.navigator;
      // @ts-expect-error - Testing undefined navigator
      delete global.navigator;

      expect(isClipboardSupported()).toBe(false);

      global.navigator = originalNavigator;
    });
  });

  describe('Round-trip Export/Import', () => {
    it('should preserve data through export and import cycle', () => {
      const jsonString = deliveryToJSONString(sampleResult, sampleCalibration);
      const imported = importDeliveryFromJSON(jsonString);

      expect(imported.delivery.speedKmh).toBe(sampleResult.speedKmh);
      expect(imported.delivery.confidence).toBe(sampleResult.confidence);
      expect(imported.trajectory.totalPoints).toBe(sampleResult.trajectoryPoints.length);
      expect(imported.calibration?.pitchLengthPixels).toBe(sampleCalibration.pitchLengthPixels);
    });

    it('should handle multiple export/import cycles', () => {
      let jsonString = deliveryToJSONString(sampleResult, sampleCalibration);

      for (let i = 0; i < 3; i++) {
        const imported = importDeliveryFromJSON(jsonString);
        expect(imported.delivery.speedKmh).toBe(135.5);

        // Re-export (note: can't directly re-export imported data without conversion)
        jsonString = deliveryToJSONString(sampleResult, sampleCalibration);
      }
    });
  });
});

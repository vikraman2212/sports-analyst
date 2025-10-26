// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock ImageData for browser APIs
global.ImageData = class ImageData {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
};

// Mock performance API if not available
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
  };
}

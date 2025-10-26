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

// Mock Canvas APIs used by tests
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function getContext(type) {
    if (type === '2d') {
      // Minimal 2D context mock sufficient for tests
      return {
        canvas: this,
        // no-op methods commonly called
        drawImage: () => {},
        createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
        getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
        putImageData: () => {},
        clearRect: () => {},
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        arc: () => {},
        closePath: () => {},
        stroke: () => {},
        fill: () => {},
        measureText: (text) => ({ width: String(text).length * 6 }),
        setTransform: () => {},
        resetTransform: () => {},
      };
    }
    return null;
  };
  // Basic toDataURL mock
  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
}

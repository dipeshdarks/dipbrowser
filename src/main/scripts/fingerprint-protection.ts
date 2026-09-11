export const FINGERPRINT_PROTECTION_SCRIPT = `
(function() {
  'use strict';

  let noise = Math.random;

  function getNoise() {
    return Math.floor(noise() * 2) - 1;
  }

  if (typeof CanvasRenderingContext2D !== 'undefined') {
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function(x, y, width, height) {
      const imageData = originalGetImageData.call(this, x, y, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] + getNoise()));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + getNoise()));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + getNoise()));
      }
      return imageData;
    };

    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function() {
      try {
        const ctx = this.getContext('2d');
        if (ctx) {
          const imageData = originalGetImageData.call(ctx, 0, 0, this.width, this.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, data[i] + getNoise()));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + getNoise()));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + getNoise()));
          }
          ctx.putImageData(imageData, 0, 0);
        }
      } catch (e) {}
      return originalToDataURL.apply(this, arguments);
    };

    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    if (originalToBlob) {
      HTMLCanvasElement.prototype.toBlob = function(callback) {
        try {
          const ctx = this.getContext('2d');
          if (ctx) {
            const imageData = originalGetImageData.call(ctx, 0, 0, this.width, this.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, Math.max(0, data[i] + getNoise()));
              data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + getNoise()));
              data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + getNoise()));
            }
            ctx.putImageData(imageData, 0, 0);
          }
        } catch (e) {}
        return originalToBlob.apply(this, arguments);
      };
    }
  }

  if (typeof WebGLRenderingContext !== 'undefined') {
    const originalReadPixels = WebGLRenderingContext.prototype.readPixels;
    WebGLRenderingContext.prototype.readPixels = function() {
      originalReadPixels.apply(this, arguments);
      const pixels = arguments[6];
      if (pixels && pixels.length) {
        for (let i = 0; i < pixels.length; i++) {
          pixels[i] = pixels[i] + getNoise();
        }
      }
    };
  }

  const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
  if (originalGetParameter) {
    WebGLRenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return 'Intel Inc.';
      if (param === 37446) return 'Intel Iris OpenGL Engine';
      return originalGetParameter.call(this, param);
    };
  }

  const originalGetExtension = WebGLRenderingContext.prototype.getExtension;
  if (originalGetExtension) {
    WebGLRenderingContext.prototype.getExtension = function(name) {
      if (name === 'WEBGL_debug_renderer_info') {
        return null;
      }
      return originalGetExtension.call(this, name);
    };
  }

  const originalAudioParam = window.AudioContext || window.webkitAudioContext;
  if (originalAudioParam) {
    const originalCreateOscillator = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function() {
      const oscillator = originalCreateOscillator.call(this);
      const originalFrequency = oscillator.frequency;
      const originalFrequencyValue = Object.getOwnPropertyDescriptor(AudioParam.prototype, 'value');
      if (originalFrequencyValue) {
        Object.defineProperty(oscillator.frequency, 'value', {
          get: function() {
            return originalFrequencyValue.get.call(this) + getNoise() * 0.00001;
          },
          set: function(val) {
            return originalFrequencyValue.set.call(this, val);
          }
        });
      }
      return oscillator;
    };
  }

  const originalDate = Date;
  const OriginalDateTimeFormat = Intl.DateTimeFormat;

  if (OriginalDateTimeFormat) {
    const resolvedOptions = OriginalDateTimeFormat.prototype.resolvedOptions;
    OriginalDateTimeFormat.prototype.resolvedOptions = function() {
      const result = resolvedOptions.call(this);
      result.timeZone = 'UTC';
      return result;
    };
  }

  Object.defineProperty(navigator, 'hardwareConcurrency', {
    get: function() { return 4; },
    configurable: true
  });

  Object.defineProperty(navigator, 'deviceMemory', {
    get: function() { return 8; },
    configurable: true
  });

  Object.defineProperty(navigator, 'platform', {
    get: function() { return 'Win32'; },
    configurable: true
  });

  const origLocalStorage = localStorage.getItem;
  localStorage.getItem = function(key) {
    return origLocalStorage.call(this, key);
  };
})();
`

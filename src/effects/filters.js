/**
 * IshikiFIESTA - Canvas Filter Pipeline
 * Each filter takes ImageData and returns modified ImageData
 */

// Helper: clamp value between 0-255
const clamp = (v) => Math.max(0, Math.min(255, v));

// Helper: apply per-pixel transform
function mapPixels(imageData, fn) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b] = fn(d[i], d[i + 1], d[i + 2], d[i + 3]);
    d[i] = clamp(r);
    d[i + 1] = clamp(g);
    d[i + 2] = clamp(b);
  }
  return imageData;
}

// ============================================================
// FILTERS
// ============================================================

export const filters = {
  normal: {
    name: 'Normal',
    emoji: '🔲',
    apply: (imageData) => imageData,
  },

  bw: {
    name: 'B&N',
    emoji: '⬛',
    apply: (imageData) => mapPixels(imageData, (r, g, b) => {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      return [gray, gray, gray];
    }),
  },

  sepia: {
    name: 'Sepia',
    emoji: '🟤',
    apply: (imageData) => mapPixels(imageData, (r, g, b) => [
      r * 0.393 + g * 0.769 + b * 0.189,
      r * 0.349 + g * 0.686 + b * 0.168,
      r * 0.272 + g * 0.534 + b * 0.131,
    ]),
  },

  vintage: {
    name: 'Vintage',
    emoji: '📜',
    apply: (imageData) => {
      mapPixels(imageData, (r, g, b) => {
        // Desaturate
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray * 0.5 + r * 0.5;
        g = gray * 0.5 + g * 0.5;
        b = gray * 0.5 + b * 0.5;
        // Warm tint
        return [r + 25, g + 10, b - 15];
      });
      // Vignette
      addVignette(imageData, 0.4);
      return imageData;
    },
  },

  pop: {
    name: 'Pop',
    emoji: '🌈',
    apply: (imageData) => mapPixels(imageData, (r, g, b) => {
      // Increase saturation and contrast
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const factor = 1.5;
      return [
        clamp(gray + (r - gray) * factor * 1.3),
        clamp(gray + (g - gray) * factor * 1.3),
        clamp(gray + (b - gray) * factor * 1.3),
      ];
    }),
  },

  neon: {
    name: 'Neon',
    emoji: '💜',
    apply: (imageData) => mapPixels(imageData, (r, g, b) => {
      // High contrast + color shift
      const contrast = 1.6;
      r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
      g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
      b = ((b / 255 - 0.5) * contrast + 0.5) * 255;
      // Purple/pink shift
      return [r * 1.1 + 20, g * 0.8, b * 1.2 + 30];
    }),
  },

  warm: {
    name: 'Calido',
    emoji: '🌅',
    apply: (imageData) => mapPixels(imageData, (r, g, b) => [
      r * 1.1 + 10,
      g * 1.05,
      b * 0.9 - 10,
    ]),
  },

  cool: {
    name: 'Frio',
    emoji: '❄️',
    apply: (imageData) => mapPixels(imageData, (r, g, b) => [
      r * 0.9 - 10,
      g * 1.0,
      b * 1.15 + 15,
    ]),
  },

  drama: {
    name: 'Drama',
    emoji: '🎭',
    apply: (imageData) => {
      mapPixels(imageData, (r, g, b) => {
        const contrast = 1.4;
        r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
        g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
        b = ((b / 255 - 0.5) * contrast + 0.5) * 255;
        // Slight desaturation
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        return [
          gray * 0.3 + r * 0.7,
          gray * 0.3 + g * 0.7,
          gray * 0.3 + b * 0.7,
        ];
      });
      addVignette(imageData, 0.5);
      return imageData;
    },
  },

  retro: {
    name: 'Retro',
    emoji: '📻',
    apply: (imageData) => {
      mapPixels(imageData, (r, g, b) => {
        // Reduce palette + warm
        r = Math.round(r / 32) * 32;
        g = Math.round(g / 32) * 32;
        b = Math.round(b / 32) * 32;
        return [r + 20, g + 10, b - 10];
      });
      addVignette(imageData, 0.3);
      return imageData;
    },
  },

  cinema: {
    name: 'Cinema',
    emoji: '🎥',
    apply: (imageData) => {
      mapPixels(imageData, (r, g, b) => {
        // Teal & orange grading
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum > 128) {
          // Highlights → warm/orange
          return [r * 1.1 + 10, g * 1.0, b * 0.85];
        } else {
          // Shadows → teal
          return [r * 0.85, g * 1.0 + 5, b * 1.15 + 10];
        }
      });
      addVignette(imageData, 0.3);
      return imageData;
    },
  },

  sunset: {
    name: 'Atardecer',
    emoji: '🌇',
    apply: (imageData) => mapPixels(imageData, (r, g, b) => [
      r * 1.15 + 20,
      g * 0.95 + 5,
      b * 0.8 - 20,
    ]),
  },

  noir: {
    name: 'Noir',
    emoji: '🖤',
    apply: (imageData) => {
      mapPixels(imageData, (r, g, b) => {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        // High contrast B&W
        const contrast = 1.5;
        const v = ((gray / 255 - 0.5) * contrast + 0.5) * 255;
        return [v, v, v];
      });
      addVignette(imageData, 0.6);
      return imageData;
    },
  },
};

// ============================================================
// HELPERS
// ============================================================

function addVignette(imageData, strength = 0.4) {
  const w = imageData.width;
  const h = imageData.height;
  const d = imageData.data;
  const cx = w / 2;
  const cy = h / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      const factor = 1 - dist * dist * strength;
      const i = (y * w + x) * 4;
      d[i] = clamp(d[i] * factor);
      d[i + 1] = clamp(d[i + 1] * factor);
      d[i + 2] = clamp(d[i + 2] * factor);
    }
  }
}

// ============================================================
// Apply filter to a data URL image → returns new data URL
// ============================================================
export function applyFilterToImage(imageSrc, filterId) {
  return new Promise((resolve) => {
    if (filterId === 'normal') {
      resolve(imageSrc);
      return;
    }

    const filter = filters[filterId];
    if (!filter) {
      resolve(imageSrc);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      filter.apply(imageData);
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = imageSrc;
  });
}

// Generate small thumbnail preview for filter selector
export function generateFilterThumbnail(imageSrc, filterId, size = 72) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // Crop to square center
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);

      if (filterId !== 'normal') {
        const filter = filters[filterId];
        if (filter) {
          const imageData = ctx.getImageData(0, 0, size, size);
          filter.apply(imageData);
          ctx.putImageData(imageData, 0, 0);
        }
      }
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = imageSrc;
  });
}

export const filterList = Object.entries(filters).map(([id, f]) => ({
  id,
  name: f.name,
  emoji: f.emoji,
}));

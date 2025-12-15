// ملف colorExtractor.js
window.ColorExtractor = class ColorExtractor {
  constructor(imageElement) {
    this.image = imageElement;
  }

  extractPalette() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const w = this.image.naturalWidth;
    const h = this.image.naturalHeight;

    const targetW = 400;
    const scale = w > targetW ? targetW / w : 1;

    canvas.width = w * scale;
    canvas.height = h * scale;
    ctx.drawImage(this.image, 0, 0, canvas.width, canvas.height);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const buckets = {};
    const step = 4 * 10; // ناخذ كل عاشر بكسل لتخفيف الحمل

    for (let i = 0; i < data.length; i += step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // استبعاد الألوان الفاتحة جداً (أبيض، بيج، أصفر باهت)
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      if (brightness > 200) continue;
      if ((r > 200 && g > 190 && b > 170)) continue;

      const key = `${Math.round(r/16)*16},${Math.round(g/16)*16},${Math.round(b/16)*16}`;
      buckets[key] = (buckets[key] || 0) + 1;
    }

    const palette = Object.entries(buckets)
      .sort((a, b) => b[1] - a[1])
      .map(([rgb]) => {
        const [r, g, b] = rgb.split(',').map(Number);
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
      });

    return palette.slice(0, 5);
  }
};

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
      if (brightness > 220) continue; // رفع العتبة قليلاً

      // تجميع الألوان في "سلات" لتقليل التنوع (مثلاً كل 32 درجة)
      const r_quant = Math.floor(r / 32) * 32;
      const g_quant = Math.floor(g / 32) * 32;
      const b_quant = Math.floor(b / 32) * 32;

      const key = `rgb(${r_quant},${g_quant},${b_quant})`;
      buckets[key] = (buckets[key] || 0) + 1;
    }

    // فرز السلات حسب التكرار
    const sortedColors = Object.entries(buckets)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([rgb]) => this.rgbToHex(rgb));

    return sortedColors.slice(0, 5); // إرجاع أفضل 5 ألوان
  }
  
  // دالة مساعِدة لتحويل RGB إلى Hex
  rgbToHex(rgb) {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return '#000000';
    
    const [r, g, b] = match.slice(1).map(Number);
    
    const componentToHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    
    return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
  }
}
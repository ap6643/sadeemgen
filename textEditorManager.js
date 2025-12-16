class TextEditorManager {
  /**
   * options = {
   *   container: HTMLElement,
   *   items: [
   *     { key: 'name', element: HTMLElement, sizeInput: HTMLInputElement },
   *     { key: 'body', element: HTMLElement, sizeInput: HTMLInputElement },
   *     { key: 'date', element: HTMLElement, sizeInput: HTMLInputElement },
   *   ],
   *   onSizeChange: (key, newSize) => void,
   *   minSize?: number,
   *   maxSize?: number
   * }
   */
  constructor(options) {
    this.container = options.container;
    this.items = options.items || [];
    this.onSizeChange = options.onSizeChange || function () {};
    this.minSize = options.minSize || 12;
    this.maxSize = options.maxSize || 72;

    this.selectedItem = null;
    this.isResizing = false;
    this.resizeCorner = null;
    this.resizeStart = null;
    this.resizeBaseSize = null;

    this.pinchState = null;
    this.overlay = null;
    this.handles = {};
    this.animating = false;

    this.init();
  }

  init() {
    this.createOverlay();
    this.bindItemEvents();
    this.bindGlobalEvents();
  }

  createOverlay() {
    const box = document.createElement('div');
    box.className = 'text-overlay-box';
    box.style.display = 'none';

    const corners = ['tl', 'tr', 'bl', 'br'];
    corners.forEach((corner) => {
      const h = document.createElement('div');
      h.className = 'text-overlay-handle text-overlay-handle-' + corner;
      h.dataset.corner = corner;
      box.appendChild(h);
      this.handles[corner] = h;
    });

    this.container.appendChild(box);
    this.overlay = box;

    // الماوس لإعادة تحجيم النص من الزوايا
    Object.values(this.handles).forEach((handle) => {
      handle.addEventListener('mousedown', (e) => this.startResize(e));
      handle.addEventListener('touchstart', (e) => this.startResize(e), {
        passive: false
      });
    });
  }

  bindItemEvents() {
    this.items.forEach((item) => {
      const el = item.element;

      // اختيار النص
      el.addEventListener('mousedown', (e) => {
        // نخلي السحب يكمل طبيعي، بس نحدد العنصر
        this.selectItem(item);
      });

      el.addEventListener('touchstart', (e) => {
        this.selectItem(item);
      });

      // تغيير الحجم بالـ wheel على الكمبيوتر
      el.addEventListener(
        'wheel',
        (e) => {
          if (!this.selectedItem || this.selectedItem.key !== item.key) return;
          e.preventDefault();
          const delta = e.deltaY;
          this.adjustFontSize(item, delta);
        },
        { passive: false }
      );

      // Pinch على الجوال
      el.addEventListener(
        'touchstart',
        (e) => this.handleTouchStart(e, item),
        { passive: false }
      );
      el.addEventListener(
        'touchmove',
        (e) => this.handleTouchMove(e, item),
        { passive: false }
      );
      el.addEventListener('touchend', (e) => this.handleTouchEnd(e, item));
      el.addEventListener('touchcancel', (e) => this.handleTouchEnd(e, item));
    });
  }

  bindGlobalEvents() {
    // إخفاء الإطار إذا ضغطنا في مكان فاضي داخل المعاينة
    this.container.addEventListener('mousedown', (e) => {
      if (this.isClickOutsideAll(e.target)) {
        this.clearSelection();
      }
    });

    this.container.addEventListener('touchstart', (e) => {
      if (this.isClickOutsideAll(e.target)) {
        this.clearSelection();
      }
    });

    // تحديث الـ overlay أثناء الحركة
    document.addEventListener('mouseup', () => {
      this.isResizing = false;
      this.resizeCorner = null;
      this.resizeStart = null;
      this.resizeBaseSize = null;
      // بعد التوقف عن السحب نتحقق من المحاذاة للمنتصف
      this.applyCenterSnap();
    });

    document.addEventListener('touchend', () => {
      this.isResizing = false;
      this.resizeCorner = null;
      this.resizeStart = null;
      this.resizeBaseSize = null;
      this.applyCenterSnap();
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isResizing) {
        this.onResizeMove(e);
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (this.isResizing) {
        this.onResizeMove(e);
      }
    });
  }

  isClickOutsideAll(target) {
    if (!this.overlay) return true;
    if (this.overlay.contains(target)) return false;

    for (const item of this.items) {
      if (item.element.contains(target)) return false;
    }
    return true;
  }

  selectItem(item) {
    this.selectedItem = item;
    this.overlay.style.display = 'block';
    this.updateOverlayRect();

    if (!this.animating) {
      this.animating = true;
      const loop = () => {
        if (!this.selectedItem) {
          this.animating = false;
          return;
        }
        this.updateOverlayRect();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  clearSelection() {
    this.selectedItem = null;
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  updateOverlayRect() {
    if (!this.selectedItem || !this.overlay) return;

    const el = this.selectedItem.element;
    if (!el.offsetWidth || !el.offsetHeight) return;

    const containerRect = this.container.getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    const left = rect.left - containerRect.left;
    const top = rect.top - containerRect.top;

    this.overlay.style.left = left + 'px';
    this.overlay.style.top = top + 'px';
    this.overlay.style.width = rect.width + 'px';
    this.overlay.style.height = rect.height + 'px';
  }

  // تغيير الحجم بناء على Scroll
  adjustFontSize(item, delta) {
    const sizeInput = item.sizeInput;
    const current = parseFloat(sizeInput.value) || 20;
    const step = delta > 0 ? -1 : 1;
    let next = current + step;
    next = Math.max(this.minSize, Math.min(this.maxSize, next));
    if (next === current) return;

    this.onSizeChange(item.key, next);
  }

  // === Resize من الزوايا ===
  startResize(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.selectedItem) return;

    const touch = event.touches ? event.touches[0] : event;
    this.isResizing = true;
    this.resizeCorner = event.target.dataset.corner || null;
    this.resizeStart = { x: touch.clientX, y: touch.clientY };

    const sizeInput = this.selectedItem.sizeInput;
    this.resizeBaseSize = parseFloat(sizeInput.value) || 20;
  }

  onResizeMove(event) {
    if (!this.isResizing || !this.selectedItem) return;

    const touch = event.touches ? event.touches[0] : event;
    const dx = touch.clientX - this.resizeStart.x;
    const dy = touch.clientY - this.resizeStart.y;

    // نستخدم التغير الرأسي كمؤشر على التكبير/التصغير
    const delta = (Math.abs(dx) > Math.abs(dy) ? dx : -dy) / 10;
    let next = this.resizeBaseSize + delta;
    next = Math.max(this.minSize, Math.min(this.maxSize, next));

    this.onSizeChange(this.selectedItem.key, next);
  }

  // === Pinch على الجوال ===
  handleTouchStart(event, item) {
    if (event.touches.length === 2) {
      event.preventDefault();
      const [t1, t2] = event.touches;
      const dist = this.distance(t1, t2);
      const base = parseFloat(item.sizeInput.value) || 20;
      this.pinchState = {
        key: item.key,
        baseSize: base,
        startDist: dist
      };
    }
  }

  handleTouchMove(event, item) {
    if (!this.pinchState) return;
    if (event.touches.length !== 2) return;

    event.preventDefault();
    const [t1, t2] = event.touches;
    const dist = this.distance(t1, t2);
    if (!dist || !this.pinchState.startDist) return;

    const scale = dist / this.pinchState.startDist;
    let next = this.pinchState.baseSize * scale;
    next = Math.max(this.minSize, Math.min(this.maxSize, next));
    this.onSizeChange(this.pinchState.key, next);
  }

  handleTouchEnd(event, item) {
    if (!this.pinchState) return;
    if (event.touches && event.touches.length > 0) return;
    this.pinchState = null;
  }

  distance(t1, t2) {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // محاذاة للمنتصف إذا العنصر قريب من وسط المعاينة
  applyCenterSnap() {
    if (!this.selectedItem) return;

    const el = this.selectedItem.element;
    const containerRect = this.container.getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const containerCenterX = containerRect.left + containerRect.width / 2;

    const diff = centerX - containerCenterX;
    const threshold = 6; // بكسلات بسيطة للمغناطيس

    if (Math.abs(diff) <= threshold) {
      const left = containerRect.width / 2 - rect.width / 2;
      el.style.left = left + 'px';
      this.updateOverlayRect();
    }
  }
}

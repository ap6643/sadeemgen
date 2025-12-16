class TextEditorManager {
  /**
   * options = {
   * container: HTMLElement,
   * items: [
   * { key: 'name', element: HTMLElement, sizeInput: HTMLInputElement },
   * // ...
   * ],
   * onSizeChange: (key, newSize) => void,
   * minSize?: number,
   * maxSize?: number
   * }
   */
  constructor(options) {
    this.container = options.container;
    this.items = options.items || [];
    this.onSizeChange = options.onSizeChange || function () {};
    this.minSize = options.minSize || 12;
    this.maxSize = options.maxSize || 72;
    this.snapThreshold = 20; // العتبة بالبكسل للمحاذاة المغناطيسية

    this.selectedItem = null;
    this.isResizing = false;
    this.resizeCorner = null;
    this.resizeStart = null;
    this.resizeBaseSize = null;

    this.isDragging = false;
    this.dragStart = null;

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
    this.overlay = document.createElement('div');
    this.overlay.className = 'text-overlay-box';
    this.overlay.style.display = 'none';
    this.container.appendChild(this.overlay);

    const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    corners.forEach(corner => {
      const handle = document.createElement('div');
      handle.className = `resize-handle ${corner}`;
      handle.dataset.corner = corner;
      handle.addEventListener('mousedown', (e) => this.startResize(e, corner));
      handle.addEventListener('touchstart', (e) => this.startResize(e, corner), { passive: false });
      this.overlay.appendChild(handle);
      this.handles[corner] = handle;
    });
  }

  bindItemEvents() {
    this.items.forEach(item => {
      item.element.addEventListener('mousedown', (e) => this.selectItem(e, item));
      item.element.addEventListener('touchstart', (e) => this.selectItem(e, item), { passive: false });
      item.element.addEventListener('wheel', (e) => this.handleWheel(e, item));
      item.element.addEventListener('touchmove', (e) => this.handleTouchMove(e, item), { passive: false });
      item.element.addEventListener('touchend', (e) => this.handleTouchEnd(e, item));
    });
  }

  bindGlobalEvents() {
    document.addEventListener('mousemove', (e) => this.onResizeMove(e));
    document.addEventListener('mouseup', () => this.endResize());
    document.addEventListener('touchmove', (e) => this.onResizeMove(e), { passive: false });
    document.addEventListener('touchend', () => this.endResize());

    // لإنهاء التحديد عند النقر خارج النص
    this.container.addEventListener('click', (e) => {
      if (!e.target.closest('.draggable-text') && !e.target.closest('.text-overlay-box')) {
        this.deselectItem();
      }
    });

    document.addEventListener('mouseup', () => this.endDrag());
    document.addEventListener('touchend', () => this.endDrag());
  }
  
  // ==================== وظائف التحديد (Selection) ====================

  selectItem(event, item) {
    if (this.selectedItem === item) {
      // إذا كان العنصر محدداً بالفعل، ابدأ السحب بدلاً من إعادة تحديده
      this.startDrag(event, item);
      return;
    }

    if (this.selectedItem) {
      this.selectedItem.element.classList.remove('selected');
    }

    this.selectedItem = item;
    item.element.classList.add('selected');
    this.updateOverlay(item.element);
    this.overlay.style.display = 'block';

    event.stopPropagation(); // منع إغلاق الـ overlay من نقر الـ container
    this.startDrag(event, item); // ابدأ السحب مباشرة بعد التحديد
  }

  deselectItem() {
    if (this.selectedItem) {
      this.selectedItem.element.classList.remove('selected');
      this.selectedItem = null;
    }
    this.overlay.style.display = 'none';
  }

  updateOverlay(el) {
    const rect = el.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    // حساب الموقع والحجم النسبي داخل الـ container
    const width = rect.width;
    const height = rect.height;
    const top = rect.top - containerRect.top + this.container.scrollTop;
    const left = rect.left - containerRect.left + this.container.scrollLeft;

    this.overlay.style.width = `${width}px`;
    this.overlay.style.height = `${height}px`;
    this.overlay.style.top = `${top}px`;
    this.overlay.style.left = `${left}px`;
  }
  
  // ==================== وظائف السحب (Drag) ====================

  startDrag(event, item) {
    if (!item || this.isResizing) return;

    this.isDragging = true;
    const pointer = event.touches ? event.touches[0] : event;

    const el = item.element;
    const elRect = el.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    this.dragStart = {
      x: pointer.clientX,
      y: pointer.clientY,
      offsetX: pointer.clientX - elRect.left,
      offsetY: pointer.clientY - elRect.top,
      baseTop: elRect.top - containerRect.top,
      baseLeft: elRect.left - containerRect.left,
    };

    el.style.cursor = 'grabbing';
    document.addEventListener('mousemove', this.onDrag.bind(this));
    document.addEventListener('touchmove', this.onDrag.bind(this), { passive: false });
  }

  onDrag(event) {
    if (!this.isDragging || !this.selectedItem) return;

    event.preventDefault(); // لمنع سحب الصفحة

    const pointer = event.touches ? event.touches[0] : event;
    const el = this.selectedItem.element;
    const containerRect = this.container.getBoundingClientRect();

    const dx = pointer.clientX - this.dragStart.x;
    const dy = pointer.clientY - this.dragStart.y;
    
    // حساب الموقع الجديد بالنسبة لحافة الـ container
    let newTop = this.dragStart.baseTop + dy;
    let newLeft = this.dragStart.baseLeft + dx;
    
    // تطبيق المحاذاة المغناطيسية (Snap)
    const snapped = this.applyCenterSnap(el, containerRect, newLeft, newTop);
    
    // إذا لم يكن هناك محاذاة، استخدم الموقع المحسوب
    if (!snapped.x) {
        newLeft = Math.max(0, Math.min(newLeft, containerRect.width - el.offsetWidth));
    } else {
        newLeft = snapped.x;
    }
    
    if (!snapped.y) {
        newTop = Math.max(0, Math.min(newTop, containerRect.height - el.offsetHeight));
    } else {
        newTop = snapped.y;
    }

    // تحديث موقع العنصر باستخدام الـ transform
    el.style.transform = `translate(0, 0)`; // إلغاء الـ translate(-50%, -50%) الأولي
    el.style.top = `${newTop}px`;
    el.style.left = `${newLeft}px`;

    this.updateOverlay(el);
  }

  endDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      if (this.selectedItem) {
        this.selectedItem.element.style.cursor = 'grab';
      }
      document.removeEventListener('mousemove', this.onDrag.bind(this));
      document.removeEventListener('touchmove', this.onDrag.bind(this));
    }
  }

  applyCenterSnap(el, containerRect, newLeft, newTop) {
    const elRect = el.getBoundingClientRect();
    const elWidth = elRect.width;
    const elHeight = elRect.height;
    
    const containerCenter = containerRect.width / 2;
    const elCenter = newLeft + elWidth / 2;
    
    const snapped = { x: false, y: false };

    // Snap أفقي للمنتصف
    if (Math.abs(elCenter - containerCenter) < this.snapThreshold) {
      newLeft = containerCenter - elWidth / 2;
      el.classList.add('snapped-x');
      this.overlay.classList.add('snapped');
      snapped.x = newLeft;
    } else {
      el.classList.remove('snapped-x');
      this.overlay.classList.remove('snapped');
    }
    
    // يمكن إضافة Snap عمودي هنا إذا لزم الأمر

    return snapped;
  }
  
  // ==================== وظائف تغيير الحجم (Resize) ====================

  startResize(event, corner) {
    if (!this.selectedItem) return;

    event.preventDefault();
    event.stopPropagation(); // منع بدأ السحب (Drag)
    
    this.isResizing = true;
    this.overlay.classList.add('resizing');
    this.resizeCorner = corner;

    const pointer = event.touches ? event.touches[0] : event;
    const el = this.selectedItem.element;

    this.resizeStart = {
      x: pointer.clientX,
      y: pointer.clientY,
      elWidth: el.offsetWidth,
      elHeight: el.offsetHeight,
    };
    
    // استخلاص حجم الخط الحالي
    const currentSize = parseFloat(window.getComputedStyle(el).fontSize);
    this.resizeBaseSize = currentSize;
  }

  onResizeMove(event) {
    if (!this.isResizing || !this.selectedItem) return;

    event.preventDefault();
    const pointer = event.touches ? event.touches[0] : event;
    const el = this.selectedItem.element;

    const dx = pointer.clientX - this.resizeStart.x;
    const dy = pointer.clientY - this.resizeStart.y;
    
    let change = 0;
    const scaleFactor = 0.08; // لضبط حساسية التكبير

    // تحديد الاتجاه بناءً على الزاوية المسحوبة (تبسيط لحساب التغيير)
    if (this.resizeCorner.includes('left') || this.resizeCorner.includes('right')) {
      change += Math.abs(dx);
    }
    if (this.resizeCorner.includes('top') || this.resizeCorner.includes('bottom')) {
      change += Math.abs(dy);
    }

    // تحديد اتجاه التكبير/التصغير (للداخل أو للخارج)
    let direction = 1;
    if (
        (this.resizeCorner.includes('top') && dy > 0) || // سحب المقبض العلوي للأسفل = تصغير
        (this.resizeCorner.includes('bottom') && dy < 0) || // سحب المقبض السفلي للأعلى = تصغير
        (this.resizeCorner.includes('left') && dx > 0) || // سحب المقبض الأيسر لليمين = تصغير
        (this.resizeCorner.includes('right') && dx < 0)    // سحب المقبض الأيمن لليسار = تصغير
    ) {
        direction = -1;
    }
    
    const delta = direction * change * scaleFactor;
    let nextSize = this.resizeBaseSize + delta;
    
    nextSize = Math.max(this.minSize, Math.min(this.maxSize, nextSize));
    this.onSizeChange(this.selectedItem.key, nextSize);

    // تحديث الـ overlay فوراً (بدون انتظار دورة التحديث الرئيسية)
    el.style.fontSize = `${nextSize}px`;
    this.updateOverlay(el);
  }

  endResize() {
    if (this.isResizing) {
      this.isResizing = false;
      this.overlay.classList.remove('resizing');
    }
  }

  // ==================== وظائف عجلة الماوس واللمس (Pinch/Wheel) ====================

  handleWheel(event, item) {
    if (this.selectedItem !== item) {
      this.selectItem(event, item);
    }

    event.preventDefault(); // منع سحب الصفحة
    
    const currentSize = parseFloat(window.getComputedStyle(item.element).fontSize);
    let delta = event.deltaY > 0 ? -1 : 1; // تصغير عند التمرير للأسفل

    let next = currentSize + delta;
    next = Math.max(this.minSize, Math.min(this.maxSize, next));
    
    this.onSizeChange(item.key, next);
    item.element.style.fontSize = `${next}px`;
    this.updateOverlay(item.element); // تحديث الـ overlay
  }

  handleTouchStart(event, item) {
    if (event.touches.length !== 2) return;
    if (this.selectedItem !== item) {
        this.selectItem(event, item);
    }

    event.stopPropagation();

    const [t1, t2] = event.touches;
    const dist = this.distance(t1, t2);
    
    this.pinchState = {
      key: item.key,
      startDist: dist,
      baseSize: parseFloat(window.getComputedStyle(item.element).fontSize),
    };
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
    item.element.style.fontSize = `${next}px`;
    this.updateOverlay(item.element);
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

}
if (window['pdfjsLib']) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

class DraggableText {
  constructor(element, container) {
    this.el = element;
    this.container = container;
    this.dragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.init();
  }

  init() {
    this.el.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.onDrag(e));
    document.addEventListener('mouseup', () => this.endDrag());

    this.el.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
    document.addEventListener('touchmove', (e) => this.onDrag(e), { passive: false });
    document.addEventListener('touchend', () => this.endDrag());
  }

  getPointerPosition(event) {
    if (event.touches && event.touches[0]) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
  }

  startDrag(event) {
    event.preventDefault();
    const pos = this.getPointerPosition(event);
    const rect = this.el.getBoundingClientRect();
    this.dragging = true;
    this.offsetX = pos.x - rect.left;
    this.offsetY = pos.y - rect.top;
  }

  onDrag(event) {
    if (!this.dragging) return;
    event.preventDefault();

    const pos = this.getPointerPosition(event);
    const containerRect = this.container.getBoundingClientRect();
    let left = pos.x - containerRect.left - this.offsetX;
    let top = pos.y - containerRect.top - this.offsetY;

    left = Math.max(0, Math.min(left, containerRect.width - this.el.offsetWidth));
    top = Math.max(0, Math.min(top, containerRect.height - this.el.offsetHeight));

    this.el.style.left = left + 'px';
    this.el.style.top = top + 'px';
  }

  endDrag() {
    this.dragging = false;
  }

  centerHorizontally(yPercent) {
    const rect = this.container.getBoundingClientRect();
    const x = (rect.width - this.el.offsetWidth) / 2;
    const y = rect.height * (yPercent / 100);
    this.el.style.left = x + 'px';
    this.el.style.top = y + 'px';
  }

  setFontSize(px) { this.el.style.fontSize = px + 'px'; }
  setText(text) { this.el.textContent = text || ''; }
  setColor(color) { if (color) this.el.style.color = color; }
  setVisible(visible) { this.el.style.display = visible ? 'block' : 'none'; }
}

class CertificateApp {
  constructor() {
    // عناصر الإدخال
    this.fileInput = document.getElementById('fileInput');
    this.fileError = document.getElementById('fileError');

    this.nameInput = document.getElementById('nameInput');
    this.namesInput = document.getElementById('namesInput');

    this.bodyInput = document.getElementById('bodyInput');
    this.useBodyInput = document.getElementById('useBodyInput');
    this.bodySettings = document.getElementById('bodySettings');

    this.useDateInput = document.getElementById('useDateInput');
    this.dateSettings = document.getElementById('dateSettings');
    this.dateInput = document.getElementById('dateInput');
    this.dateTypeInput = document.getElementById('dateTypeInput');
    this.dateSizeInput = document.getElementById('dateSizeInput');
    this.dateColorInput = document.getElementById('dateColorInput');

    this.nameSizeInput = document.getElementById('nameSizeInput');
    this.bodySizeInput = document.getElementById('bodySizeInput');

    this.nameColorInput = document.getElementById('nameColorInput');
    this.bodyColorInput = document.getElementById('bodyColorInput');

    // أزرار
    this.resetPositionsBtn = document.getElementById('resetPositionsBtn');
    this.downloadPdfBtn = document.getElementById('downloadPdfBtn');
    this.downloadZipBtn = document.getElementById('downloadZipBtn');
    this.zipRow = document.getElementById('zipRow');

    this.loadingIndicator = document.getElementById('loadingIndicator');

    // المعاينة
    this.previewInner = document.getElementById('previewInner');
    this.placeholder = document.getElementById('placeholder');
    this.bgImg = document.getElementById('certificateBackground');

    this.nameTextEl = document.getElementById('nameText');
    this.bodyTextEl = document.getElementById('bodyText');
    this.dateTextEl = document.getElementById('dateText');

    this.nameText = null;
    this.bodyText = null;
    this.dateText = null;

    // ✅ جديد: مدير تحرير النص (التحديد + التكبير/التصغير)
    this.textEditorManager = null;

    this.bgWidth = null;
    this.bgHeight = null;

    this.defaultHijriDate = '1447-05-21';
    this.defaultGregorianDate = '2025-02-02';

    this.init();
  }

  init() {
    this.initDraggables();

    // ✅ جديد: تفعيل textEditorManager (بعد ما تنشأ الـ draggables)
    this.initTextEditorManager();

    this.bindEvents();
    this.computeDefaultDates();
    this.setDefaultDateInput();
    this.updateTexts();
    this.updateZipButtonVisibility();

    // إخفاء النصوص الاختيارية افتراضياً
    this.useBodyInput.checked = false;
    this.bodySettings.style.display = 'none';
    this.bodyText.setVisible(false);

    this.useDateInput.checked = false;
    this.dateSettings.style.display = 'none';
    this.dateText.setVisible(false);
  }

  initDraggables() {
    this.nameText = new DraggableText(this.nameTextEl, this.previewInner);
    this.bodyText = new DraggableText(this.bodyTextEl, this.previewInner);
    this.dateText = new DraggableText(this.dateTextEl, this.previewInner);
  }

  // ✅ جديد: تفعيل TextEditorManager بدون ما نكسر أي شيء
  initTextEditorManager() {
    // إذا الملف مو محمّل أو فيه خطأ، لا نوقف التطبيق
    if (typeof TextEditorManager === 'undefined') return;

    this.textEditorManager = new TextEditorManager({
      container: this.previewInner,
      items: [
        { key: 'name', element: this.nameTextEl, sizeInput: this.nameSizeInput },
        { key: 'body', element: this.bodyTextEl, sizeInput: this.bodySizeInput },
        { key: 'date', element: this.dateTextEl, sizeInput: this.dateSizeInput },
      ],
      minSize: 10,
      maxSize: 72,
      onSizeChange: (key, newSize) => {
        const size = Math.round(newSize);

        if (key === 'name') {
          this.nameSizeInput.value = size;
          this.nameText.setFontSize(size);
        } else if (key === 'body') {
          this.bodySizeInput.value = size;
          this.bodyText.setFontSize(size);
        } else if (key === 'date') {
          this.dateSizeInput.value = size;
          this.dateText.setFontSize(size);
        }
      }
    });
  }

  // ✅ جديد: استخراج ألوان تلقائي بعد تحميل الخلفية (صورة أو PDF)
  applyExtractedColors() {
    if (!window.ColorExtractor) return;
    if (!this.bgImg || !this.bgImg.naturalWidth || !this.bgImg.naturalHeight) return;

    try {
      const extractor = new window.ColorExtractor(this.bgImg);
      const palette = extractor.extractPalette();
      if (!palette || palette.length === 0) return;

      // نخلي أول لون يضبط لون الاسم (مثل فكرة الميزة)
      this.nameColorInput.value = palette[0];
      
      this.bodyColorInput.value = palette[0];

      this.updateTexts();
    } catch (e) {
      console.warn('ColorExtractor error:', e);
    }
  }

  bindEvents() {
    this.fileInput.addEventListener('change', (e) => this.onFileSelected(e));

    this.resetPositionsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.resetPositions();
    });

    // زر PDF واحد
    this.downloadPdfBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.exportAsPDF();
    });

    // زر ZIP (عدة ملفات)
    this.downloadZipBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.exportAsZip();
    });

    const instantInputs = [
      this.nameInput,
      this.bodyInput,
      this.nameSizeInput,
      this.bodySizeInput,
      this.nameColorInput,
      this.bodyColorInput,
      this.dateInput,
      this.dateTypeInput,
      this.dateSizeInput,
      this.dateColorInput
    ];
    instantInputs.forEach(input => {
      if (!input) return;
      input.addEventListener('input', () => this.updateTexts());
    });

    this.dateTypeInput.addEventListener('change', () => {
      this.setDefaultDateInput();
      this.updateTexts();
    });

    this.useBodyInput.addEventListener('change', () => {
      const enabled = this.useBodyInput.checked;
      this.bodySettings.style.display = enabled ? 'block' : 'none';
      this.updateTexts();
    });

    this.useDateInput.addEventListener('change', () => {
      const enabled = this.useDateInput.checked;
      this.dateSettings.style.display = enabled ? 'block' : 'none';
      if (enabled && !this.dateInput.value.trim()) {
        this.setDefaultDateInput();
      }
      this.updateTexts();
    });

    this.namesInput.addEventListener('input', () => {
      this.syncFirstNameFromList();
      this.updateZipButtonVisibility();
    });
  }

  // إظهار/إخفاء زر ZIP حسب عدد الأسماء
  updateZipButtonVisibility() {
    const lines = this.namesInput.value
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length > 1) {
      this.zipRow.style.display = 'block';
    } else {
      this.zipRow.style.display = 'none';
    }
  }

  computeDefaultDates() {
    const today = new Date();

    try {
      const gFmt = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      this.defaultGregorianDate = gFmt.format(today).replace(/\//g, '-');
    } catch {
      this.defaultGregorianDate = '2025-02-02';
    }

    try {
      const hFmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      let h = hFmt.format(today);
      h = h.replace(/\s*هـ.*/, '').replace(/\//g, '-').trim();
      this.defaultHijriDate = h;
    } catch {
      this.defaultHijriDate = this.defaultGregorianDate;
    }
  }

  setDefaultDateInput() {
    const type = this.dateTypeInput.value;
    this.dateInput.value = (type === 'hijri')
      ? this.defaultHijriDate
      : this.defaultGregorianDate;
  }

  syncFirstNameFromList() {
    const lines = this.namesInput.value
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    if (lines.length > 0) {
      this.nameInput.value = lines[0];
      this.updateTexts();
    }
  }

  showError(msg) {
    this.fileError.textContent = msg;
    this.fileError.style.display = 'block';
  }

  clearError() {
    this.fileError.textContent = '';
    this.fileError.style.display = 'none';
  }

  async onFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    this.clearError();
    const type = (file.type || '').toLowerCase();

    try {
      if (type.includes('pdf')) {
        if (!window['pdfjsLib']) {
          this.showError('تعذّر قراءة ملف الـ PDF. يرجى التأكد من تحميل مكتبة pdf.js.');
          return;
        }
        await this.loadPdfFirstPageAsImage(file);
      } else if (type.startsWith('image/')) {
        await this.loadImageFile(file);
      } else {
        this.showError('نوع الملف غير مدعوم. يرجى رفع صورة (PNG / JPG) أو ملف PDF.');
        return;
      }

      this.placeholder.style.display = 'none';
      this.previewInner.style.display = 'block';

      setTimeout(() => this.resetPositions(), 100);

    } catch (err) {
      console.error(err);
      this.showError('حدث خطأ أثناء قراءة الملف. يرجى تجربة ملف آخر أو تقليل حجمه.');
    }
  }

  loadImageFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      this.bgImg.onload = () => {
        this.updatePreviewSizeToBackground();

        // ✅ جديد: استخراج اللون بعد تحميل الصورة
        this.applyExtractedColors();

        resolve();
      };
      this.bgImg.onerror = () => reject(new Error('تعذّر تحميل الصورة.'));
      this.bgImg.src = url;
    });
  }

  async loadPdfFirstPageAsImage(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const dataUrl = canvas.toDataURL('image/png');
    return new Promise((resolve, reject) => {
      this.bgImg.onload = () => {
        this.updatePreviewSizeToBackground();

        // ✅ جديد: استخراج اللون بعد تحويل PDF لصورة
        this.applyExtractedColors();

        resolve();
      };
      this.bgImg.onerror = () => reject(new Error('تعذّر تحويل ملف الـ PDF إلى صورة.'));
      this.bgImg.src = dataUrl;
    });
  }

  updatePreviewSizeToBackground() {
    const naturalWidth = this.bgImg.naturalWidth || 1000;
    const naturalHeight = this.bgImg.naturalHeight || 700;

    this.bgWidth = naturalWidth;
    this.bgHeight = naturalHeight;

    const maxWidth = 800;
    let width = naturalWidth;
    let height = naturalHeight;

    if (width > maxWidth) {
      const scale = maxWidth / width;
      width = maxWidth;
      height = height * scale;
    }

    this.previewInner.style.width = width + 'px';
    this.previewInner.style.height = height + 'px';
  }

  updateTexts() {
    const name = this.nameInput.value.trim() || 'اسم المستلم';
    const body = this.bodyInput ? (this.bodyInput.value.trim() || 'نص الشهادة') : '';

    const nameSize = parseInt(this.nameSizeInput.value, 10) || 26;
    const bodySize = parseInt(this.bodySizeInput.value, 10) || 18;
    const dateSize = parseInt(this.dateSizeInput.value, 10) || 14;

    const nameColor = this.nameColorInput.value || '#5b2c90';
    const bodyColor = this.bodyColorInput.value || '#2a213d';
    const dateColor = this.dateColorInput.value || '#000000';

    this.nameText.setText(name);
    this.nameText.setFontSize(nameSize);
    this.nameText.setColor(nameColor);

    const useBody = this.useBodyInput.checked;
    this.bodyText.setVisible(useBody);
    if (useBody) {
      this.bodyText.setText(body);
      this.bodyText.setFontSize(bodySize);
      this.bodyText.setColor(bodyColor);
    }

    const useDate = this.useDateInput.checked;
    this.dateText.setVisible(useDate);
    if (useDate) {
      let rawDate = this.dateInput.value.trim();
      if (!rawDate) {
        rawDate = this.dateTypeInput.value === 'hijri'
          ? this.defaultHijriDate
          : this.defaultGregorianDate;
      }
      const suffix = this.dateTypeInput.value === 'hijri' ? 'هـ' : 'م';
      this.dateText.setText(rawDate + suffix);
      this.dateText.setFontSize(dateSize);
      this.dateText.setColor(dateColor);
    }
  }

  resetPositions() {
    this.nameText.centerHorizontally(40);
    this.bodyText.centerHorizontally(55);
    this.dateText.centerHorizontally(70);
  }

  // تنظيف اسم الملف
  makeSafeFileName(name, index = 1) {
    const base = (name || '').trim();
    if (!base) return `certificate-${index}`;
    return base.replace(/[\\/:*?"<>|]/g, '_');
  }

  // 1️⃣ زر PDF: ملف واحد بعدة صفحات
  async exportAsPDF() {
    if (this.previewInner.style.display === 'none') {
      alert('يرجى رفع ملف الشهادة أولاً.');
      return;
    }

    const raw = (this.namesInput.value || '').split('\n');
    let names = raw.map(n => n.trim()).filter(Boolean);

    if (names.length === 0) {
      const singleName = this.nameInput.value.trim() || 'اسم المستلم';
      names = [singleName];
    }

    if (!window.jspdf) {
      alert('مكتبة jsPDF غير متوفرة.');
      return;
    }
    const { jsPDF } = window.jspdf;

    this.loadingIndicator.style.display = 'block';

    try {
      let pdf = null;
      let orientation = 'l';

      for (let i = 0; i < names.length; i++) {
        const currentName = names[i];

        this.nameInput.value = currentName;
        this.updateTexts();

        const canvas = await html2canvas(this.previewInner, {
          scale: 2,
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pageW = canvas.width;
        const pageH = canvas.height;
        orientation = pageW >= pageH ? 'l' : 'p';

        if (!pdf) {
          pdf = new jsPDF(orientation, 'pt', [pageW, pageH]);
        } else {
          pdf.addPage([pageW, pageH], orientation);
        }

        pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
      }

      let filename = 'certificates.pdf';
      if (names.length === 1) {
        filename = this.makeSafeFileName(names[0], 1) + '.pdf';
      }

      pdf.save(filename);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء توليد ملف PDF.');
    } finally {
      this.loadingIndicator.style.display = 'none';
    }
  }

  // 2️⃣ زر ZIP: ملف مضغوط فيه PDF مستقل لكل اسم
  async exportAsZip() {
    if (this.previewInner.style.display === 'none') {
      alert('يرجى رفع ملف الشهادة أولاً.');
      return;
    }

    const raw = (this.namesInput.value || '').split('\n');
    let names = raw.map(n => n.trim()).filter(Boolean);

    if (names.length <= 1) {
      alert('يلزم إدخال أكثر من اسم في قائمة الأسماء لاستخدام هذا الخيار.');
      return;
    }

    if (!window.jspdf) {
      alert('مكتبة jsPDF غير متوفرة.');
      return;
    }
    if (!window.JSZip || !window.saveAs) {
      alert('مكتبات الضغط (JSZip / FileSaver) غير متوفرة.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const zip = new JSZip();

    this.loadingIndicator.style.display = 'block';

    try {
      for (let i = 0; i < names.length; i++) {
        const currentName = names[i];

        this.nameInput.value = currentName;
        this.updateTexts();

        const canvas = await html2canvas(this.previewInner, {
          scale: 2,
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pageW = canvas.width;
        const pageH = canvas.height;
        const orientation = pageW >= pageH ? 'l' : 'p';

        const pdf = new jsPDF(orientation, 'pt', [pageW, pageH]);
        pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);

        const blob = pdf.output('blob');
        const safeName = this.makeSafeFileName(currentName, i + 1);
        zip.file(`${safeName}.pdf`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipName = 'certificates.zip';
      saveAs(zipBlob, zipName);

    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء توليد ملف ZIP.');
    } finally {
      this.loadingIndicator.style.display = 'none';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new CertificateApp();
});

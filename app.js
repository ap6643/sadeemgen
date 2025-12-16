if (window['pdfjsLib']) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// تم تبسيط DraggableText إلى مجرد كلاس لتحديد العناصر عند التحميل الأولي
// يتم تفعيل السحب والـ resize بواسطة TextEditorManager
class DraggableText {
  constructor(element, container) {
    this.el = element;
    this.container = container;
    this.init();
  }

  init() {
    // يمكن هنا تعيين الموقع الأولي، لكن لا نربط الأحداث لتركها لـ TextEditorManager
  }
}

class CertificateApp {
  constructor() {
    // العناصر الأساسية
    this.fileInput = document.getElementById('fileInput');
    this.nameListInput = document.getElementById('nameListInput');
    this.dateInput = document.getElementById('dateInput');
    this.downloadPdfBtn = document.getElementById('downloadPdfBtn');
    this.downloadZipBtn = document.getElementById('downloadZipBtn');
    this.loadingIndicator = document.getElementById('loadingIndicator');

    // عناصر المعاينة
    this.previewInner = document.getElementById('previewInner');
    this.placeholder = document.getElementById('placeholder');
    this.bgImg = document.getElementById('certificateBackground');

    // عناصر النصوص
    this.nameTextEl = document.getElementById('nameText');
    this.bodyTextEl = document.getElementById('bodyText');
    this.dateTextEl = document.getElementById('dateText');
    
    // عناصر خيارات النص
    this.nameColorInput = document.getElementById('nameColorInput');
    this.nameSizeInput = document.getElementById('nameSizeInput');
    this.bodyColorInput = document.getElementById('bodyColorInput');
    this.bodySizeInput = document.getElementById('bodySizeInput');
    this.dateColorInput = document.getElementById('dateColorInput');
    this.dateSizeInput = document.getElementById('dateSizeInput');

    this.colorSuggestionsEl = document.getElementById('colorSuggestions');

    this.draggableItems = [];
    this.currentFileUrl = null;
    this.textManager = null; // سيتم تعيينها لاحقاً
  }

  init() {
    this.initDraggables();
    this.bindEvents();
    this.setInitialStyles();
    
    // 🔥 تفعيل TextEditorManager
    this.textManager = new TextEditorManager({
        container: this.previewInner,
        items: [
            { key: 'name', element: this.nameTextEl, sizeInput: this.nameSizeInput },
            { key: 'body', element: this.bodyTextEl, sizeInput: this.bodySizeInput },
            { key: 'date', element: this.dateTextEl, sizeInput: this.dateSizeInput },
        ],
        onSizeChange: this.handleTextSizeChange.bind(this),
        minSize: 10,
        maxSize: 72
    });
  }

  setInitialStyles() {
    this.nameTextEl.style.color = this.nameColorInput.value;
    this.nameTextEl.style.fontSize = `${this.nameSizeInput.value}px`;
    this.bodyTextEl.style.color = this.bodyColorInput.value;
    this.bodyTextEl.style.fontSize = `${this.bodySizeInput.value}px`;
    this.dateTextEl.style.color = this.dateColorInput.value;
    this.dateTextEl.style.fontSize = `${this.dateSizeInput.value}px`;

    this.dateTextEl.textContent = this.dateInput.value;
  }

  initDraggables() {
    this.draggableItems = [
      new DraggableText(this.nameTextEl, this.previewInner),
      new DraggableText(this.bodyTextEl, this.previewInner),
      new DraggableText(this.dateTextEl, this.previewInner),
    ];
  }

  bindEvents() {
    this.fileInput.addEventListener('change', this.onFileSelected.bind(this));
    this.nameListInput.addEventListener('input', this.updateTexts.bind(this));
    this.dateInput.addEventListener('input', this.updateTexts.bind(this));

    this.nameColorInput.addEventListener('input', this.updateTexts.bind(this));
    this.nameSizeInput.addEventListener('input', this.updateTexts.bind(this));
    this.bodyColorInput.addEventListener('input', this.updateTexts.bind(this));
    this.bodySizeInput.addEventListener('input', this.updateTexts.bind(this));
    this.dateColorInput.addEventListener('input', this.updateTexts.bind(this));
    this.dateSizeInput.addEventListener('input', this.updateTexts.bind(this));

    this.downloadPdfBtn.addEventListener('click', () => this.generateCertificates('pdf'));
    this.downloadZipBtn.addEventListener('click', () => this.generateCertificates('zip'));
  }
  
  // 🔥 معالجة تغيير حجم الخط من TextEditorManager
  handleTextSizeChange(key, newSize) {
    let inputEl;
    switch(key) {
      case 'name': inputEl = this.nameSizeInput; break;
      case 'body': inputEl = this.bodySizeInput; break;
      case 'date': inputEl = this.dateSizeInput; break;
      default: return;
    }
    inputEl.value = Math.round(newSize * 10) / 10; // تقريب لأقرب رقم عشري
    this.updateTexts();
  }


  // ==================== وظائف تحديث الواجهة ====================

  updateTexts() {
    // تحديث محتوى النص
    const names = this.nameListInput.value.trim().split('\n').filter(n => n.trim() !== '');
    this.nameTextEl.textContent = names.length > 0 ? names[0].trim() : 'اسم المستلم';
    this.dateTextEl.textContent = this.dateInput.value;

    // تحديث الأنماط
    this.nameTextEl.style.color = this.nameColorInput.value;
    this.nameTextEl.style.fontSize = `${this.nameSizeInput.value}px`;
    this.bodyTextEl.style.color = this.bodyColorInput.value;
    this.bodyTextEl.style.fontSize = `${this.bodySizeInput.value}px`;
    this.dateTextEl.style.color = this.dateColorInput.value;
    this.dateTextEl.style.fontSize = `${this.dateSizeInput.value}px`;
    
    // تفعيل/تعطيل أزرار التحميل
    this.downloadPdfBtn.disabled = this.downloadZipBtn.disabled = !(this.currentFileUrl && names.length > 0);
  }
  
  // ==================== وظائف معالجة الملفات ====================

  async onFileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (this.currentFileUrl) {
      URL.revokeObjectURL(this.currentFileUrl); // تحرير الذاكرة
      this.currentFileUrl = null;
    }

    this.loadingIndicator.style.display = 'flex';
    this.downloadPdfBtn.disabled = this.downloadZipBtn.disabled = true;

    try {
      if (file.type.startsWith('image/')) {
        this.currentFileUrl = URL.createObjectURL(file);
        this.bgImg.src = this.currentFileUrl;
        await new Promise(resolve => this.bgImg.onload = resolve);
        
      } else if (file.type === 'application/pdf') {
        const imgUrl = await this.loadPdfFirstPageAsImage(file);
        this.bgImg.src = imgUrl;
        // لا نحتاج لـ onload هنا لأن loadPdfFirstPageAsImage تنتظر التحميل

      } else {
        throw new Error('نوع ملف غير مدعوم.');
      }

      this.bgImg.style.display = 'block';
      this.placeholder.style.display = 'none';
      this.previewInner.style.display = 'block';
      
      // 🔥 استخلاص الألوان واقتراحها
      this.extractAndSuggestColors(); 
      
      setTimeout(() => this.updateTexts(), 100); // تحديث النصوص وتفعيل الأزرار بعد المعاينة
      
    } catch (err) {
      console.error('فشل في تحميل الملف:', err);
      alert('حدث خطأ أثناء تحميل الملف. يرجى التأكد من صلاحية الملف.');
      this.bgImg.style.display = 'none';
      this.placeholder.style.display = 'flex';
    } finally {
      this.loadingIndicator.style.display = 'none';
    }
  }

  async loadPdfFirstPageAsImage(file) {
    if (!window.pdfjsLib) {
      alert('مكتبة PDF.js غير متوفرة.');
      throw new Error('PDF.js library not available.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    
    // مقياس ثابت (مثلاً 2x للجودة)
    const viewport = page.getViewport({ scale: 2 }); 
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;

    // استخدام toDataURL بدلاً من blob للحصول على URL فوري
    return canvas.toDataURL('image/jpeg', 0.9);
  }
  
  // ==================== وظائف الألوان المقترحة ====================

  // 🔥 دالة لاستخلاص واقتراح الألوان
  extractAndSuggestColors() {
    this.colorSuggestionsEl.innerHTML = '<span class="text-label">ألوان مقترحة:</span>';
    if (!this.bgImg.src || !window.ColorExtractor) return;

    // تأكد من أن الصورة محمّلة
    if (!this.bgImg.complete || this.bgImg.naturalWidth === 0) {
      this.bgImg.onload = () => this._performColorExtraction();
    } else {
      this._performColorExtraction();
    }
  }

  // 🔥 دالة التنفيذ الفعلية
  _performColorExtraction() {
    try {
      const extractor = new window.ColorExtractor(this.bgImg);
      const palette = extractor.extractPalette();
      
      palette.forEach(color => {
          const btn = document.createElement('div');
          btn.className = 'suggested-color-button';
          btn.style.backgroundColor = color;
          btn.title = color;
          btn.addEventListener('click', () => this.applySuggestedColor(color));
          this.colorSuggestionsEl.appendChild(btn);
      });
      
    } catch (e) {
      console.warn("فشل في استخلاص الألوان:", e);
    }
  }

  applySuggestedColor(color) {
    // يمكن للمستخدم اختيار أي لون مقترح وتطبيقه على الاسم
    this.nameColorInput.value = color;
    this.updateTexts();
  }
  
  // ==================== وظائف التصدير (PDF/ZIP) ====================

  async generateCertificates(format) {
    const names = this.nameListInput.value.trim().split('\n').filter(n => n.trim() !== '');
    if (names.length === 0) {
      alert('يرجى إدخال أسماء المستلمين.');
      return;
    }

    if (!window.html2canvas) {
      alert('مكتبة html2canvas غير متوفرة.');
      return;
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('مكتبة jsPDF غير متوفرة.');
      return;
    }
    if (format === 'zip' && (!window.JSZip || !window.saveAs)) {
      alert('مكتبات الضغط (JSZip / FileSaver) غير متوفرة.');
      return;
    }

    this.loadingIndicator.style.display = 'flex';
    this.textManager.deselectItem(); // إخفاء إطار التحديد قبل التصوير

    const { jsPDF } = window.jspdf;
    let mainPdf;
    let zip;

    if (format === 'pdf') {
      mainPdf = new jsPDF({ unit: 'pt' });
    } else if (format === 'zip') {
      zip = new JSZip();
    }

    try {
      for (let i = 0; i < names.length; i++) {
        const currentName = names[i].trim();

        // 1. إعداد المعاينة للاسم الحالي
        this.nameTextEl.textContent = currentName;
        this.updateTexts();

        // 2. تصوير المعاينة إلى Canvas
        const canvas = await html2canvas(this.previewInner, {
          scale: 2, // لزيادة جودة الصورة
          useCORS: true,
          logging: false // لتقليل رسائل الكونسول
        });

        const imgData = canvas.toDataURL('image/png');
        const pageW = canvas.width / 2; // نقسم على 2 لتعويض الـ scale=2 في jspdf
        const pageH = canvas.height / 2;
        const orientation = pageW >= pageH ? 'l' : 'p';

        if (format === 'pdf') {
          if (i > 0) {
            mainPdf.addPage([pageW, pageH], orientation);
          }
          mainPdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);
        } else if (format === 'zip') {
          const pdf = new jsPDF(orientation, 'pt', [pageW, pageH]);
          pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH);

          const blob = pdf.output('blob');
          const safeName = this.makeSafeFileName(currentName, i + 1);
          zip.file(`${safeName}.pdf`, blob);
        }
      }

      // 3. التصدير الفعلي
      if (format === 'pdf') {
        mainPdf.save('الشهادات_المجمعة.pdf');
      } else if (format === 'zip') {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        window.saveAs(zipBlob, 'شهادات_المستلمين.zip');
      }

    } catch (error) {
      console.error('خطأ أثناء توليد الشهادات:', error);
      alert(`حدث خطأ أثناء التوليد: ${error.message}`);
    } finally {
      // 4. إعادة واجهة المستخدم لحالتها الأصلية
      this.loadingIndicator.style.display = 'none';
      this.nameTextEl.textContent = names.length > 0 ? names[0].trim() : 'اسم المستلم';
      this.updateTexts(); 
    }
  }

  makeSafeFileName(name, index) {
    // إزالة الأحرف غير القانونية واستبدالها بشرطة سفلية
    let safe = name.replace(/[^a-z0-9\u0621-\u064A\s]/gi, ''); 
    safe = safe.trim().replace(/\s+/g, '_'); // استبدال المسافات
    if (safe.length > 30) safe = safe.substring(0, 30);
    return safe || `شهادة_رقم_${index}`;
  }
}

// تشغيل التطبيق
document.addEventListener('DOMContentLoaded', () => {
  const app = new CertificateApp();
  app.init();
});
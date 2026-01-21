# SADEEM X – Certificate Generator

A modern, interactive certificate generator built with **Vanilla JavaScript (OOP)**.  
SADEEM X allows you to design, customize, and export professional certificates from **image or PDF templates** with real-time visual editing.

🌐 Website: https://sadeem-x.com  
📧 Contact: ahmadalharthi98@gmail.com

---

## ✨ Key Features

- Upload certificate templates as **images (PNG/JPG)** or **PDF files**
- Live preview with **drag-and-drop text positioning**
- Advanced text editing:
  - Resize text using corner handles
  - Mouse wheel zoom
  - Pinch-to-zoom on touch devices
  - Smart snapping for precise alignment
- Proper **RTL Arabic text handling**
  - Arabic names are **right-anchored**
  - Long names expand left without shifting position
- Automatic **color palette extraction** from the certificate background
- Optional certificate body text and date (Hijri or Gregorian)
- Batch generation using a list of names
- Export options:
  - Single PDF with multiple pages
  - Separate PDFs for each recipient inside a ZIP file
- Fully responsive UI (desktop & mobile)
- Clean, modular, and extensible architecture

---

## 🆕 What’s New in v2.2

- Fixed Arabic name alignment issue for variable-length names
- Implemented **right-anchored text positioning** for certificates
- Ensured consistent layout for short and long Arabic names
- Improved overall text positioning reliability during export
- Minor UI and UX refinements

---

## 🧱 Tech Stack

- **HTML5**
- **CSS3**
- **Vanilla JavaScript (OOP architecture)**

### External Libraries
- `html2canvas`
- `jsPDF`
- `PDF.js`
- `JSZip`
- `FileSaver.js`

## 📁 Project Structure
/index.html
/styles.css
/app.js
/textEditorManager.js
/colorExtractor.js
/assets (optional)


---

## 🚀 Getting Started

1. Clone or download the repository
2. Open `index.html` in your browser
3. Upload a certificate template (image or PDF)
4. Enter recipient name(s)
5. Customize text, colors, and layout
6. Export as PDF or ZIP

> No build step, backend, or framework required.

---

## 🧩 Architecture Notes

- Built using **pure JavaScript** with an OOP approach
- Text manipulation logic is isolated in `TextEditorManager`
- Dragging and positioning handled via `DraggableText`
- Color extraction is handled independently via `ColorExtractor`
- Designed for easy extension:
  - Additional text layers
  - Alignment modes
  - Templates and presets
  - Branding and organization-specific layouts

---

## 📜 License

MIT License © 2025 SADEEM X  
Developed by **Eng. Ahmad Alharthi**

---

## 🤝 Contributions

Pull requests, bug reports, and feature suggestions are welcome.  
This project is actively maintained and evolving.


## 📁 Project Structure


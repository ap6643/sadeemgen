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
  - Resize text using handles
  - Mouse wheel zoom
  - Pinch-to-zoom on touch devices
  - Smart center snapping
- Automatic **color palette extraction** from the certificate background
- Clickable color suggestions for instant styling
- Optional certificate body text and date (Hijri or Gregorian)
- Batch generation using a list of names
- Export options:
  - Single PDF with multiple pages
  - Separate PDFs for each recipient inside a ZIP file
- Fully responsive UI (desktop & mobile)
- Clean, modular, and extensible architecture

---

## 🆕 What’s New in v2.1

- Advanced text editor with resize handles and snapping
- Mouse wheel & touch gesture font scaling
- Improved color extraction accuracy and filtering
- Refactored text editing logic into a dedicated manager module
- Enhanced export flow and UI responsiveness
- Added branded footer with copyright information

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

---

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

> No build step or backend required.

---

## 🧩 Architecture Notes

- Built using **pure JavaScript** with an OOP approach
- Text manipulation logic is isolated in `TextEditorManager`
- Color extraction is handled independently via `ColorExtractor`
- Designed for easy extension (new text layers, presets, branding, etc.)

---

## 📜 License

MIT License © 2025 SADEEM X  
Developed by **Eng. Ahmad Alharthi**

---

## 🤝 Contributions

Pull requests and feature suggestions are welcome.  
This project is actively maintained and evolving.

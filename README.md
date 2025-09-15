# HEMA - Human Evaluation of Medical AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.0-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![No Installation Required](https://img.shields.io/badge/Installation-None%20Required-brightgreen.svg)](https://github.com/amirrouh/HEMA)

## Overview

HEMA is a **zero-installation** web-based platform designed for clinical experts to evaluate medical AI systems. Simply download and double-click `index.html` to start using it immediately. No Python, Node.js, or any server installation required!

### 🎯 Key Features

- **📊 Multi-Modal Evaluation**: Support for text analysis and 2D medical image evaluation
- **🖼️ Medical Image Support**: Native handling of NRRD and NIfTI medical imaging formats
- **✏️ Advanced Annotation Tools**: Drawing, erasing, and commenting with persistent storage
- **⭐ Rating System**: 10-point scale rating for slice-by-slice evaluation
- **📄 Professional Reports**: Generate comprehensive PDF and web reports with embedded images
- **💾 Persistent Storage**: All annotations and evaluations saved locally using browser storage
- **🔄 Fresh Start**: Complete data reset functionality for new evaluations
- **📱 Responsive Design**: Modern, mobile-friendly interface with Bootstrap 5
- **⚡ Zero Installation**: No servers, no installations - just double-click and run!

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- That's it! No other software required.

### Installation

**Option 1: Direct Download & Run (Recommended)**
1. **Download the repository** as a ZIP file from GitHub
2. **Extract** the ZIP file to your desired location
3. **Double-click** `index.html` to open in your browser
4. **Start evaluating** medical AI systems immediately!

**Option 2: Git Clone**
```bash
git clone https://github.com/amirrouh/HEMA.git
cd HEMA
# Double-click index.html or open in browser
```

**Option 3: Local Server (if needed for advanced file operations)**
```bash
# Only if you need to load large local files
python3 -m http.server 8000
# Then open: http://localhost:8000
```

## 📋 Usage Guide

### 1. Evaluation Modes

Choose from two evaluation modes on the landing page:

- **Segmentation Mode**: 2D medical image evaluation with annotations, ratings, and comments
- **Text Analysis Mode**: Evaluation of AI-generated medical text and reports

### 2. Loading Medical Data

1. **Select Files**: Upload your medical image files (NRRD/NIfTI) and corresponding label files
2. **Wait for Processing**: Files are parsed and rendered automatically
3. **Navigate**: Use slice navigation controls to move through the dataset

### 3. Annotation Tools

#### Drawing Tools
- **🖊️ Draw Tool**: Create annotations with customizable colors and brush sizes
- **🧽 Erase Tool**: Remove specific annotations
- **👋 Pan Tool**: Navigate around zoomed images
- **🔍 Zoom Controls**: Zoom in/out and reset view

#### Comments & Ratings
- **💬 Comments**: Add text comments to specific slices
- **⭐ Ratings**: Rate slices on a 1-10 scale
- **📝 Persistent Storage**: All data automatically saved

### 4. Report Generation

#### Web Reports
- View comprehensive evaluation summaries
- Interactive slice browsing with embedded images
- Real-time statistics and progress tracking

#### PDF Export
- Professional formatted reports
- Embedded slice images with annotations
- Complete evaluation statistics
- Suitable for clinical documentation

### 5. Data Management

#### Fresh Start
- **🔄 Complete Reset**: Removes all annotations, comments, and ratings
- **🧹 Clean Slate**: Returns application to initial state
- **✅ Verified Clearing**: Comprehensive data removal with verification

## 🏗️ Architecture

### Core Technologies

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **UI Framework**: Bootstrap 5.3.0 with Font Awesome icons
- **PDF Generation**: jsPDF 2.5.1 for report export
- **Compression**: Pako 2.1.0 for NRRD decompression
- **Storage**: Browser localStorage for data persistence
- **Architecture**: Pure client-side application, no server required

### File Structure

```
HEMA/
├── index.html              # Main application entry point
├── js/
│   └── hema-app.js         # Core application logic (2900+ lines)
├── css/
│   ├── layout.css          # Layout and positioning styles
│   └── theme.css           # Visual theme and colors
├── templates/              # Modular HTML components
│   ├── navbar.html         # Navigation component
│   ├── landing-page.html   # Home page
│   ├── mode-*.html         # Evaluation mode interfaces
│   ├── viewer-*.html       # Specialized viewers
│   └── database.html       # Report viewer
└── README.md               # This file
```

### Template System

HEMA uses a custom template loader for modular architecture:

```javascript
await loadTemplate('template-name', 'container-id');
```

Templates are cached after first load for optimal performance.

## 🔧 Development

### Code Organization

The application follows a modular design pattern:

- **Navigation**: Mode selection and routing
- **File Handling**: Medical format parsers (NRRD, NIfTI, STL)
- **Segmentation Viewer**: Core image rendering and annotation engine
- **Report Generation**: PDF and web report creation
- **Storage Management**: Persistent data handling

### Key Classes

- `Navigation`: Handles routing between evaluation modes
- `FileHandler`: Processes medical imaging files
- `SegmentationViewer`: Manages image display and annotations
- `ErrorHandler`: Centralized error management

### Storage Schema

Data is stored in browser localStorage with these keys:

- `hema-comments`: Array of slice comments
- `hema-slice-ratings`: Object mapping slice numbers to ratings
- `hema-slice-vector-annotations`: Vector annotation data
- `hema-slice-images`: Captured slice images for reports

## 📊 Medical Domain Support

### Supported Formats

#### Medical Images
- **NRRD** (Nearly Raw Raster Data): With optional gzip compression
- **NIfTI** (Neuroimaging Informatics Technology Initiative): Standard neuroimaging format

#### Use Cases
- **Radiology Review**: Slice-by-slice evaluation of medical scans
- **AI Validation**: Systematic assessment of AI-generated segmentations
- **Clinical Research**: Structured data collection for medical studies
- **Quality Assurance**: Comprehensive evaluation workflows

### Evaluation Workflow

1. **Load Medical Data**: Upload image and label files
2. **Navigate Dataset**: Browse through slices systematically
3. **Make Annotations**: Draw regions of interest, add comments
4. **Rate Quality**: Assign numerical ratings to slices
5. **Generate Reports**: Export comprehensive evaluation documentation

## 🛡️ Privacy & Security

- **100% Local Processing**: All data processed in your browser, never uploaded anywhere
- **Zero Installation Security**: No servers to maintain or secure
- **Offline Capable**: Core functionality works completely offline
- **Local Storage Only**: Data stored locally in browser only
- **HIPAA Friendly**: No data transmission, perfect for sensitive medical data
- **No Dependencies**: Runs entirely in your browser without external requirements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and patterns
- Test with various medical imaging formats
- Ensure browser compatibility
- Document any new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Medical Imaging Community**: For format specifications and standards
- **Open Source Libraries**: jsPDF, Pako, and Bootstrap teams
- **Clinical Experts**: For feedback and validation requirements

## 📞 Support

For questions, issues, or contributions:

- **GitHub Issues**: [Create an issue](https://github.com/amirrouh/HEMA/issues)
- **Documentation**: Refer to `CLAUDE.md` for detailed technical guidance
- **Code Review**: All contributions welcome and reviewed

---

**Built for medical professionals, by developers who care about healthcare technology.**

**Ready to use in seconds - just download and double-click!** 🚀

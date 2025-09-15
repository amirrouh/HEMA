# HEMA - Human Evaluation of Medical AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.0-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)

## Overview

HEMA is a comprehensive web-based platform designed for clinical experts to evaluate medical AI systems. It provides an intuitive interface for reviewing medical imaging data, making annotations, and generating detailed evaluation reports.

### 🎯 Key Features

- **📊 Multi-Modal Evaluation**: Support for text, 2D medical images, 3D models, and combined assessments
- **🖼️ Medical Image Support**: Native handling of NRRD, NIfTI, and STL medical imaging formats
- **✏️ Advanced Annotation Tools**: Drawing, erasing, and commenting with persistent storage
- **⭐ Rating System**: 10-point scale rating for slice-by-slice evaluation
- **📄 Professional Reports**: Generate comprehensive PDF and web reports with embedded images
- **💾 Persistent Storage**: All annotations and evaluations saved locally using browser storage
- **🔄 Fresh Start**: Complete data reset functionality for new evaluations
- **📱 Responsive Design**: Modern, mobile-friendly interface with Bootstrap 5

## 🚀 Quick Start

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for file loading security)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/amirrouh/HEMA.git
   cd HEMA
   ```

2. **Start a local web server:**

   **Option A: Python**
   ```bash
   python3 -m http.server 8000
   ```

   **Option B: Node.js**
   ```bash
   npx http-server -p 8000
   ```

   **Option C: PHP**
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser:**
   ```
   http://localhost:8000
   ```

## 📋 Usage Guide

### 1. Evaluation Modes

Choose from four evaluation modes on the landing page:

- **Mode 1**: Text-based assessment
- **Mode 2**: 2D medical image evaluation with annotations
- **Mode 3**: 3D model evaluation (STL files)
- **Mode 4**: Combined multi-modal assessment

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
- **3D Graphics**: Three.js r128 for STL visualization
- **PDF Generation**: jsPDF 2.5.1 for report export
- **Compression**: Pako 2.1.0 for NRRD decompression
- **Storage**: Browser localStorage for data persistence

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
- **STL** (Stereolithography): 3D surface mesh files for anatomical models

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

- **Local Processing**: All data processed in browser, no server uploads
- **No External Dependencies**: Core functionality works offline
- **Secure Storage**: Data stored locally in browser only
- **HIPAA Considerations**: No data transmission, suitable for sensitive medical data

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
- **Open Source Libraries**: Three.js, jsPDF, Pako, and Bootstrap teams
- **Clinical Experts**: For feedback and validation requirements

## 📞 Support

For questions, issues, or contributions:

- **GitHub Issues**: [Create an issue](https://github.com/amirrouh/HEMA/issues)
- **Documentation**: Refer to `CLAUDE.md` for detailed technical guidance
- **Code Review**: All contributions welcome and reviewed

---

**Built for medical professionals, by developers who care about healthcare technology.**
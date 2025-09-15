HEMA - Human Evaluation of Medical AI Platform
==============================================

A modular web-based platform for clinical experts to evaluate medical AI systems.
Built with vanilla JavaScript ES6 modules, HTML5, and CSS3.

QUICK START
-----------
1. Double-click index.html to open in your browser
   OR
2. Start a local web server:
   python3 -m http.server 8000
   Then visit: http://localhost:8000

FEATURES
--------
- Segmentation Evaluation: Analyze medical image segmentation with overlay visualization
- Text Analysis: Evaluate AI-generated medical text and reports
- Pure client-side application (no backend required)
- Responsive design for desktop, tablet, and mobile

SUPPORTED FORMATS
-----------------
- Medical Images: NRRD, NIfTI (.nii/.nii.gz)
- Compression: GZIP-compressed NRRD files

PROJECT STRUCTURE
------------------
├── index.html                 # Main entry point
├── css/
│   ├── main.css              # Core styles, typography, layout
│   ├── components.css        # Component-specific styles
│   └── responsive.css        # Mobile/tablet responsive styles
├── js/
│   └── hema-app.js          # Single-file application (no modules)
└── README.txt               # This file

ARCHITECTURE
------------
- Single-File Application: All JavaScript bundled into one organized file
- Component-Based: Reusable, maintainable component classes using prototypes
- Event-Driven: Clean separation between components using callbacks
- No Build Process: Works directly with file:// protocol (double-click to run)
- Zero Dependencies: Only external CDN libraries (Bootstrap, Pako)
- Template-Free: Pure vanilla JavaScript DOM manipulation

DEPENDENCIES
------------
External Libraries (loaded from CDN):
- Bootstrap 5.3.0 (UI framework)
- Font Awesome 6.4.0 (icons)
- Pako 2.1.0 (GZIP decompression)

BROWSER REQUIREMENTS
--------------------
- Modern browser with JavaScript support
- File API support
- Canvas 2D support

DEVELOPMENT
-----------
The application uses vanilla JavaScript in a single file, so it works directly:
1. Double-click index.html to open in browser
2. No build process or server required
3. Works with file:// protocol

The organized single-file structure provides:
- Easy deployment and distribution
- No dependency management needed
- Clean separation of concerns within the file
- Maintainable and readable codebase
- Component-based architecture using prototypes

USAGE
-----
1. Open the application in a web browser
2. Select an evaluation mode (Segmentation or Text Analysis)
3. Upload required files:
   - Segmentation: Medical image + segmentation labels
   - Text Analysis: Paste or upload text content
4. Use the interactive viewer to evaluate the AI output
5. Navigate using slice controls and opacity adjustments

TROUBLESHOOTING
---------------
- If the application doesn't load, check the browser console for error messages
- Ensure JavaScript is enabled in your browser
- Large files may take time to process - this is normal
- The application works offline once loaded

VERSION
-------
1.0.0 - Single-File Vanilla JavaScript Implementation

LICENSE
-------
This is a demo application for medical AI evaluation purposes.
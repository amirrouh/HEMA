# HEMA Templates Directory

This directory contains modular HTML templates that are dynamically loaded by the main application for better organization and maintainability.

## Template Structure

### Core Pages
- **database.html** - Database viewer for annotations and comments with PDF export
- **help.html** - Help and documentation page

### UI Components
- **navbar.html** - Main navigation bar with brand and action buttons
- **landing-page.html** - Home page with mode selection cards
- **viewer-separator.html** - Visual separator between modes and viewer
- **viewer-container.html** - Main viewer container for images and 3D models
- **comments-panel.html** - Comments system panel

### Mode Templates
- **mode-segmentation.html** - Segmentation evaluation mode interface
- **mode-3d.html** - 3D model evaluation mode interface  
- **mode-text.html** - Text analysis evaluation mode interface

### Control Panels
- **segmentation-controls.html** - Segmentation-specific controls (sliders, annotation tools)

## Loading System

Templates are loaded dynamically using the `TemplateLoader` class in `/js/template-loader.js`. The main application (`index.html`) loads all necessary templates at startup and injects them into designated containers.

## Benefits of Modular Architecture

1. **Maintainability** - Each component is in its own file, making updates easier
2. **Reusability** - Templates can be reused across different parts of the application
3. **Organization** - Clear separation of concerns and logical file structure
4. **Performance** - Templates can be cached and loaded on-demand
5. **Development** - Multiple developers can work on different components simultaneously

## Path References

When templates reference external resources (CSS, JS, images), use relative paths from the templates directory:
- CSS: `../css/style.css`
- JavaScript: `../js/script.js`
- Images: `../images/image.png`
- Back to main page: `../index.html`
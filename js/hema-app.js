/*!
 * HEMA - Human Evaluation of Medical AI Platform
 * Version: 1.0.0
 * A vanilla JavaScript application for medical AI evaluation
 * No modules, no build process, no server required
 */

(function(window, document) {
    'use strict';

    // ============================================================================
    // CONFIGURATION
    // ============================================================================
    const CONFIG = {
        // Application metadata
        APP_NAME: 'HEMA',
        APP_FULL_NAME: 'Human Evaluation of Medical AI',
        VERSION: '1.0.0',

        // Canvas settings
        CANVAS: {
            MIN_HEIGHT: 500,
            MOBILE_MIN_HEIGHT: 300
        },

        // Label color mapping for segmentation
        CATEGORY_COLORS: [
            [255, 0, 0],     // Red
            [0, 255, 0],     // Green
            [0, 0, 255],     // Blue
            [255, 255, 0],   // Yellow
            [255, 0, 255],   // Magenta
            [0, 255, 255],   // Cyan
            [255, 128, 0],   // Orange
            [128, 0, 255]    // Purple
        ],

        // Supported file formats
        SUPPORTED_FORMATS: {
            MEDICAL_IMAGES: ['.nrrd', '.nii', '.nii.gz']
        },

        // Animation and interaction settings
        ANIMATION: {
            SCROLL_DELAY: 150,
            SCROLL_ADDITIONAL_DELAY: 100,
            FADE_DURATION: 500
        },

        // Element IDs (for consistency)
        ELEMENTS: {
            LANDING_PAGE: 'landing-page',
            VIEWER_CONTAINER: 'viewer-container',
            VIEWER_SEPARATOR: 'viewer-separator',
            CANVAS_CONTAINER: 'canvas-container',
            CONTROLS: 'controls',
            ERROR: 'error',
            IMAGE_CANVAS: 'imageCanvas',
            LABEL_CANVAS: 'labelCanvas',
            ANNOTATION_CANVAS: 'annotationCanvas',
            IMAGE_FILE: 'imageFile',
            LABEL_FILE: 'labelFile',
            SLICE_SLIDER: 'sliceSlider',
            OPACITY_SLIDER: 'opacitySlider',
            SLICE_INFO: 'sliceInfo',
            OPACITY_VALUE: 'opacityValue',
            PAN_TOOL: 'panTool',
            ZOOM_IN: 'zoomIn',
            ZOOM_OUT: 'zoomOut',
            RESET_VIEW: 'resetView',
            ZOOM_VALUE: 'zoomValue',
            VIEWER_CONTROLS: 'viewer-controls',
            DRAW_TOOL: 'drawTool',
            ERASE_TOOL: 'eraseTool',
            COMMENT_TOOL: 'commentTool',
            CLEAR_ANNOTATIONS: 'clearAnnotations',
            REPORT_BTN: 'reportBtn',
            REFRESH_BTN: 'refreshBtn',
            STAR_RATING_PANEL: 'star-rating-panel',
            STAR_RATING: 'starRating',
            RATING_DISPLAY: 'ratingDisplay',
            COMMENTS_PANEL: 'comments-panel',
            COMMENTS_LIST: 'comments-list',
            COMMENT_INPUT: 'comment-input',
            ADD_COMMENT: 'add-comment',
            CLOSE_COMMENTS: 'closeComments',
            REPORT_SECTION: 'report-section',
            GENERATE_REPORT_BTN: 'generateReportBtn',
            COLOR_PICKER: 'colorPicker'
        },

        // Mode configurations
        MODES: {
            SEGMENTATION: 'segmentation',
            TEXT: 'text'
        }
    };

    // ============================================================================
    // UTILITIES
    // ============================================================================
    const Utils = {
        /**
         * Precise vertical centering for smooth scrolling
         */
        scrollToCenter: function(element) {
            if (!element) return;

            const rect = element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const elementCenter = rect.top + window.scrollY + (rect.height / 2);
            const scrollToPosition = elementCenter - (viewportHeight / 2);

            window.scrollTo({
                top: Math.max(0, scrollToPosition),
                behavior: 'smooth'
            });
        },

        /**
         * Get element by ID with error checking
         */
        getElementById: function(id, required) {
            const element = document.getElementById(id);
            if (!element && required) {
                console.error(`Required element with ID '${id}' not found`);
            }
            return element;
        },

        /**
         * Show element by setting display style
         */
        showElement: function(elementOrId, display) {
            display = display || 'block';
            const element = typeof elementOrId === 'string'
                ? document.getElementById(elementOrId)
                : elementOrId;
            if (element) {
                element.style.display = display;
            }
        },

        /**
         * Hide element by setting display to none
         */
        hideElement: function(elementOrId) {
            const element = typeof elementOrId === 'string'
                ? document.getElementById(elementOrId)
                : elementOrId;
            if (element) {
                element.style.display = 'none';
            }
        },

        /**
         * Check if file has supported medical imaging format
         */
        isSupportedMedicalFormat: function(filename) {
            const lowerName = filename.toLowerCase();
            return CONFIG.SUPPORTED_FORMATS.MEDICAL_IMAGES.some(function(ext) {
                return lowerName.endsWith(ext);
            });
        },

        /**
         * Get file format type
         */
        getFileFormat: function(filename) {
            const lowerName = filename.toLowerCase();
            if (lowerName.endsWith('.nrrd')) return 'nrrd';
            if (lowerName.endsWith('.nii') || lowerName.endsWith('.nii.gz')) return 'nifti';
            return 'unknown';
        },

        /**
         * Debounce function calls
         */
        debounce: function(func, wait) {
            let timeout;
            return function() {
                const context = this;
                const args = arguments;
                const later = function() {
                    timeout = null;
                    func.apply(context, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * Check if device is mobile
         */
        isMobile: function() {
            return window.innerWidth <= 768;
        },

        /**
         * Format bytes to human readable string
         */
        formatBytes: function(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        /**
         * Clamp value between min and max
         */
        clamp: function(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },

        /**
         * Add CSS class with animation support
         */
        addClassWithAnimation: function(element, className) {
            if (element) {
                element.classList.add(className);
                // Trigger reflow for animation
                element.offsetHeight;
            }
        }
    };

    // ============================================================================
    // FILE PARSERS
    // ============================================================================
    const Parsers = {
        /**
         * NRRD File Parser
         */
        NRRD: {
            parse: function(buffer) {
                const bytes = new Uint8Array(buffer);

                // Find header end (double newline)
                let headerEnd = 0;
                for (let i = 0; i < bytes.length - 1; i++) {
                    if (bytes[i] === 10 && bytes[i + 1] === 10) {
                        headerEnd = i + 2;
                        break;
                    }
                }

                if (headerEnd === 0) {
                    throw new Error('Invalid NRRD file - no header end found');
                }

                // Parse header
                const headerString = new TextDecoder().decode(bytes.slice(0, headerEnd));
                const headerInfo = this.parseHeader(headerString);

                if (!headerInfo.sizes) {
                    throw new Error('Invalid NRRD file - no sizes found');
                }

                // Parse data
                let dataBytes = bytes.slice(headerEnd);

                // Handle GZIP compression
                if (headerInfo.encoding === 'gzip' || headerInfo.encoding === 'gz') {
                    try {
                        if (typeof pako === 'undefined') {
                            throw new Error('Pako library not available for GZIP decompression');
                        }
                        dataBytes = pako.inflate(dataBytes);
                    } catch (err) {
                        throw new Error('Failed to decompress GZIP data: ' + err.message);
                    }
                }

                // Create typed array based on type
                const data = this.createTypedArray(dataBytes, headerInfo.type, headerInfo.sizes);

                return {
                    data: data,
                    sizes: headerInfo.sizes,
                    type: headerInfo.type
                };
            },

            parseHeader: function(headerString) {
                const lines = headerString.split('\n');
                let sizes = null;
                let type = null;
                let encoding = null;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const colonIndex = line.indexOf(':');
                    if (colonIndex === -1) continue;

                    const field = line.substring(0, colonIndex).trim().toLowerCase();
                    const value = line.substring(colonIndex + 1).trim();

                    switch (field) {
                        case 'sizes':
                            sizes = value.split(' ').map(Number).filter(function(n) { return !isNaN(n); });
                            break;
                        case 'type':
                            type = value;
                            break;
                        case 'encoding':
                            encoding = value;
                            break;
                    }
                }

                return { sizes: sizes, type: type, encoding: encoding };
            },

            createTypedArray: function(dataBytes, type, sizes) {
                const totalVoxels = sizes.reduce(function(a, b) { return a * b; }, 1);

                switch (type) {
                    case 'unsigned char':
                    case 'uint8':
                        return new Uint8Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                    case 'short':
                    case 'int16':
                        return new Int16Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                    case 'unsigned short':
                    case 'uint16':
                        return new Uint16Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                    case 'int':
                    case 'signed int':
                    case 'int32':
                        return new Int32Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                    case 'unsigned int':
                    case 'uint32':
                        return new Uint32Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                    case 'float':
                        return new Float32Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                    case 'double':
                        return new Float64Array(dataBytes.buffer, dataBytes.byteOffset, totalVoxels);
                    default:
                        throw new Error('Unsupported data type: ' + type);
                }
            }
        },

        /**
         * NIfTI File Parser
         */
        NIfTI: {
            parse: function(buffer) {
                const dataView = new DataView(buffer);

                // Check for NIFTI magic number
                const magic = dataView.getUint32(344, true);
                if (magic !== 0x2B31696E) { // "ni1\0" in little endian
                    throw new Error('Not a valid NIFTI file');
                }

                const headerInfo = this.parseHeader(dataView);
                const data = this.parseData(buffer, headerInfo);
                const type = this.getTypeString(headerInfo.datatype);

                return {
                    data: data,
                    sizes: headerInfo.sizes,
                    type: type
                };
            },

            parseHeader: function(dataView) {
                // Parse header dimensions
                const dims = [];
                for (let i = 0; i < 8; i++) {
                    dims.push(dataView.getUint16(40 + i * 2, true));
                }

                const ndim = dims[0];
                const sizes = dims.slice(1, ndim + 1);
                const datatype = dataView.getUint16(70, true);
                const bitpix = dataView.getUint16(72, true);
                const voxOffset = dataView.getFloat32(108, true);
                const sclSlope = dataView.getFloat32(112, true);
                const sclInter = dataView.getFloat32(116, true);
                const headerSize = 348;
                const dataStart = voxOffset > 0 ? Math.floor(voxOffset) : headerSize;

                return {
                    sizes: sizes,
                    datatype: datatype,
                    bitpix: bitpix,
                    dataStart: dataStart,
                    sclSlope: sclSlope,
                    sclInter: sclInter
                };
            },

            parseData: function(buffer, headerInfo) {
                const totalVoxels = headerInfo.sizes.reduce(function(a, b) { return a * b; }, 1);
                let data = this.createTypedArray(buffer, headerInfo.datatype, headerInfo.dataStart, totalVoxels);

                // Apply scaling if specified
                if (headerInfo.sclSlope !== 0 && headerInfo.sclSlope !== 1) {
                    data = this.applyScaling(data, headerInfo.sclSlope, headerInfo.sclInter);
                } else if (headerInfo.sclInter !== 0) {
                    data = this.applyOffset(data, headerInfo.sclInter);
                }

                return data;
            },

            createTypedArray: function(buffer, datatype, dataStart, totalVoxels) {
                switch (datatype) {
                    case 2: // DT_UNSIGNED_CHAR / UINT8
                        return new Uint8Array(buffer, dataStart, totalVoxels);
                    case 4: // DT_SIGNED_SHORT / INT16
                        return new Int16Array(buffer, dataStart, totalVoxels);
                    case 8: // DT_SIGNED_INT / INT32
                        return new Int32Array(buffer, dataStart, totalVoxels);
                    case 16: // DT_FLOAT / FLOAT32
                        return new Float32Array(buffer, dataStart, totalVoxels);
                    case 64: // DT_DOUBLE / FLOAT64
                        return new Float64Array(buffer, dataStart, totalVoxels);
                    case 256: // DT_INT8
                        return new Int8Array(buffer, dataStart, totalVoxels);
                    case 512: // DT_UINT16
                        return new Uint16Array(buffer, dataStart, totalVoxels);
                    case 768: // DT_UINT32
                        return new Uint32Array(buffer, dataStart, totalVoxels);
                    default:
                        throw new Error('Unsupported NIFTI data type: ' + datatype);
                }
            },

            applyScaling: function(data, slope, intercept) {
                const scaledData = new Float32Array(data.length);
                for (let i = 0; i < data.length; i++) {
                    scaledData[i] = data[i] * slope + intercept;
                }
                return scaledData;
            },

            applyOffset: function(data, intercept) {
                const scaledData = new Float32Array(data.length);
                for (let i = 0; i < data.length; i++) {
                    scaledData[i] = data[i] + intercept;
                }
                return scaledData;
            },

            getTypeString: function(datatype) {
                switch (datatype) {
                    case 2:
                    case 256:
                        return 'unsigned char';
                    case 4:
                        return 'short';
                    case 8:
                        return 'int';
                    case 16:
                        return 'float';
                    case 64:
                        return 'double';
                    case 512:
                        return 'unsigned short';
                    case 768:
                        return 'unsigned int';
                    default:
                        return 'datatype_' + datatype;
                }
            }
        }
    };

    // ============================================================================
    // COMPONENTS
    // ============================================================================

    /**
     * Navigation Component
     */
    function Navigation() {
        this.currentMode = null;
        this.init();
    }

    Navigation.prototype = {
        init: function() {
            this.setupModeButtons();
            this.setupBackButtons();
            this.setupBrandButton();
        },

        setupModeButtons: function() {
            const self = this;
            document.querySelectorAll('[data-mode]').forEach(function(button) {
                const mode = button.getAttribute('data-mode');
                button.addEventListener('click', function() {
                    self.showMode(mode);
                });
            });
        },

        setupBackButtons: function() {
            const self = this;
            document.querySelectorAll('.back-button').forEach(function(button) {
                button.addEventListener('click', function() {
                    self.showLanding();
                });
            });
        },

        setupBrandButton: function() {
            const self = this;
            const brandButton = document.querySelector('.navbar-brand');
            if (brandButton) {
                brandButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.showLanding();
                });
            }
        },

        showMode: function(mode) {
            console.log('Switching to mode: ' + mode);

            // Hide landing page
            Utils.hideElement(CONFIG.ELEMENTS.LANDING_PAGE);

            // Hide all modes
            this.hideAllModes();

            // Show selected mode
            const modeElement = Utils.getElementById('mode-' + mode);
            if (modeElement) {
                Utils.showElement(modeElement);
                this.currentMode = mode;
            } else {
                console.error('Mode element not found: mode-' + mode);
                return;
            }

            // Hide viewer initially until files are loaded
            Utils.hideElement(CONFIG.ELEMENTS.VIEWER_CONTAINER);
            Utils.hideElement(CONFIG.ELEMENTS.VIEWER_SEPARATOR);

            // Smooth scroll to the file upload section
            const self = this;
            setTimeout(function() {
                self.scrollToModeContent(modeElement);
            }, CONFIG.ANIMATION.SCROLL_DELAY);
        },

        showLanding: function() {
            console.log('Returning to landing page');

            // Hide all modes
            this.hideAllModes();

            // Hide viewer elements
            Utils.hideElement(CONFIG.ELEMENTS.VIEWER_CONTAINER);
            Utils.hideElement(CONFIG.ELEMENTS.VIEWER_SEPARATOR);

            // Show landing page
            Utils.showElement(CONFIG.ELEMENTS.LANDING_PAGE);

            this.currentMode = null;
        },

        hideAllModes: function() {
            const modes = [CONFIG.MODES.SEGMENTATION, CONFIG.MODES.TEXT];
            modes.forEach(function(mode) {
                Utils.hideElement('mode-' + mode);
            });
        },

        scrollToModeContent: function(modeElement) {
            const contentRow = modeElement.querySelector('.row.g-4.justify-content-center') ||
                              modeElement.querySelector('.row.justify-content-center');

            if (contentRow) {
                Utils.scrollToCenter(contentRow);
            } else {
                const firstCard = modeElement.querySelector('.card');
                if (firstCard) {
                    Utils.scrollToCenter(firstCard);
                } else {
                    Utils.scrollToCenter(modeElement);
                }
            }
        },

        getCurrentMode: function() {
            return this.currentMode;
        },

        isOnLanding: function() {
            return this.currentMode === null;
        },

        showViewer: function() {
            Utils.showElement(CONFIG.ELEMENTS.VIEWER_CONTAINER);
            Utils.showElement(CONFIG.ELEMENTS.VIEWER_SEPARATOR);

            setTimeout(function() {
                const viewerContainer = Utils.getElementById(CONFIG.ELEMENTS.VIEWER_CONTAINER);
                if (viewerContainer) {
                    setTimeout(function() {
                        Utils.scrollToCenter(viewerContainer);
                    }, CONFIG.ANIMATION.SCROLL_ADDITIONAL_DELAY);
                }
            }, CONFIG.ANIMATION.SCROLL_DELAY);
        },

        hideViewer: function() {
            Utils.hideElement(CONFIG.ELEMENTS.VIEWER_CONTAINER);
            Utils.hideElement(CONFIG.ELEMENTS.VIEWER_SEPARATOR);
        }
    };

    /**
     * Error Handler Component
     */
    function ErrorHandler() {
        this.errorElement = null;
        this.init();
    }

    ErrorHandler.prototype = {
        init: function() {
            this.errorElement = Utils.getElementById(CONFIG.ELEMENTS.ERROR);
            if (!this.errorElement) {
                console.warn('Error element not found');
            }
        },

        showError: function(message, error) {
            console.error('Error:', message, error || 'No error details available');

            if (this.errorElement) {
                this.errorElement.textContent = message;
                Utils.showElement(this.errorElement);

                // Auto-hide after 10 seconds
                const self = this;
                setTimeout(function() {
                    self.hideError();
                }, 10000);
            } else {
                // Fallback to alert if no error element
                alert('Error: ' + message);
            }
        },

        hideError: function() {
            if (this.errorElement) {
                Utils.hideElement(this.errorElement);
            }
        },

        showDimensionError: function() {
            const message = 'Image and label files have different dimensions. Please ensure both files represent the same scan.';
            this.showError(message);
        },

        clearErrors: function() {
            this.hideError();
        },

        hasError: function() {
            return this.errorElement && this.errorElement.style.display !== 'none';
        }
    };

    /**
     * File Handler Component
     */
    function FileHandler() {
        this.loadedFiles = {
            image: null,
            label: null
        };
        this.callbacks = {
            onImageLoaded: null,
            onLabelLoaded: null,
            onError: null
        };
    }

    FileHandler.prototype = {
        init: function() {
            this.setupFileInputs();
        },

        setupFileInputs: function() {
            const self = this;
            const imageFile = Utils.getElementById(CONFIG.ELEMENTS.IMAGE_FILE);
            const labelFile = Utils.getElementById(CONFIG.ELEMENTS.LABEL_FILE);

            if (imageFile) {
                imageFile.addEventListener('change', function(e) {
                    self.handleFileLoad(e, 'image');
                });
            }

            if (labelFile) {
                labelFile.addEventListener('change', function(e) {
                    self.handleFileLoad(e, 'label');
                });
            }
        },

        setCallbacks: function(callbacks) {
            this.callbacks = Object.assign(this.callbacks, callbacks);
        },

        handleFileLoad: function(event, type) {
            const self = this;
            const file = event.target.files[0];
            if (!file) return;

            console.log('Loading ' + type + ' file:', file.name);

            this.readFileAsArrayBuffer(file)
                .then(function(buffer) {
                    return self.parseFile(buffer, file.name);
                })
                .then(function(data) {
                    self.loadedFiles[type] = {
                        data: data,
                        filename: file.name,
                        size: file.size
                    };

                    console.log(type + ' file loaded successfully:', data.sizes);

                    // Call appropriate callback
                    if (type === 'image' && self.callbacks.onImageLoaded) {
                        self.callbacks.onImageLoaded(data);
                    } else if (type === 'label' && self.callbacks.onLabelLoaded) {
                        self.callbacks.onLabelLoaded(data);
                    }
                })
                .catch(function(error) {
                    console.error('Error loading ' + type + ':', error);
                    if (self.callbacks.onError) {
                        self.callbacks.onError('Error loading ' + type + ': ' + error.message);
                    }
                });
        },

        readFileAsArrayBuffer: function(file) {
            return new Promise(function(resolve, reject) {
                const reader = new FileReader();
                reader.onload = function(e) { resolve(e.target.result); };
                reader.onerror = function() { reject(new Error('Failed to read file')); };
                reader.readAsArrayBuffer(file);
            });
        },

        parseFile: function(buffer, filename) {
            const format = Utils.getFileFormat(filename);

            switch (format) {
                case 'nrrd':
                    return Parsers.NRRD.parse(buffer);
                case 'nifti':
                    return Parsers.NIfTI.parse(buffer);
                default:
                    throw new Error('Unsupported file format: ' + format + '. Please use ' + CONFIG.SUPPORTED_FORMATS.MEDICAL_IMAGES.join(', ') + ' files.');
            }
        },

        hasBothFiles: function() {
            return this.loadedFiles.image && this.loadedFiles.label;
        },

        getImageData: function() {
            return this.loadedFiles.image ? this.loadedFiles.image.data : null;
        },

        getLabelData: function() {
            return this.loadedFiles.label ? this.loadedFiles.label.data : null;
        },

        clearFiles: function() {
            this.loadedFiles = {
                image: null,
                label: null
            };
        },

        validateDimensions: function() {
            if (!this.hasBothFiles()) return false;

            const imageData = this.getImageData();
            const labelData = this.getLabelData();

            console.log('Image dimensions:', imageData.sizes);
            console.log('Label dimensions:', labelData.sizes);

            const dimensionsMatch = imageData.sizes.join(',') === labelData.sizes.join(',');
            console.log('Dimensions match?', dimensionsMatch);

            return dimensionsMatch;
        }
    };

    /**
     * Segmentation Viewer Component with Zoom and Pan
     */
    function SegmentationViewer() {
        this.imageData = null;
        this.labelData = null;
        this.currentSlice = 0;
        this.labelOpacity = 0.5;
        this.labelCategories = [];
        this.imageCanvas = null;
        this.labelCanvas = null;
        this.annotationCanvas = null;
        this.imageCtx = null;
        this.labelCtx = null;
        this.annotationCtx = null;

        // Zoom and Pan properties
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.minZoom = 0.1;
        this.maxZoom = 10;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.containerWidth = 0;
        this.containerHeight = 0;

        // Annotation properties
        this.annotationMode = null;
        this.isAnnotating = false;
        this.drawingColor = '#ff0000';
        this.brushSize = 3;
        this.imageWidth = 0;
        this.imageHeight = 0;

        // Rating system
        this.sliceRatings = {};
        this.loadRatings();

        // Annotation persistence per slice
        this.sliceAnnotations = {};
        this.loadSliceAnnotations();

        this.init();
    }

    SegmentationViewer.prototype = {
        init: function() {
            this.setupCanvases();
            this.setupControls();
        },

        setupCanvases: function() {
            this.imageCanvas = Utils.getElementById(CONFIG.ELEMENTS.IMAGE_CANVAS);
            this.labelCanvas = Utils.getElementById(CONFIG.ELEMENTS.LABEL_CANVAS);
            this.annotationCanvas = Utils.getElementById(CONFIG.ELEMENTS.ANNOTATION_CANVAS);

            if (this.imageCanvas && this.labelCanvas && this.annotationCanvas) {
                this.imageCtx = this.imageCanvas.getContext('2d');
                this.labelCtx = this.labelCanvas.getContext('2d');
                this.annotationCtx = this.annotationCanvas.getContext('2d');

                // Style the canvases with proper layering
                this.imageCanvas.style.zIndex = '1'; // Bottom layer
                this.labelCanvas.style.position = 'absolute';
                this.labelCanvas.style.top = '0';
                this.labelCanvas.style.left = '0';
                this.labelCanvas.style.zIndex = '2'; // Middle layer

                this.annotationCanvas.style.position = 'absolute';
                this.annotationCanvas.style.top = '0';
                this.annotationCanvas.style.left = '0';
                this.annotationCanvas.style.zIndex = '10'; // Top layer for annotations
                this.annotationCanvas.style.pointerEvents = 'none'; // Will be enabled when in annotation mode

                // Setup canvas interaction events
                this.setupCanvasEvents();
                console.log('Canvas contexts and events initialized');
            } else {
                console.error('Canvas elements not found');
            }
        },

        setupControls: function() {
            const self = this;
            const sliceSlider = Utils.getElementById(CONFIG.ELEMENTS.SLICE_SLIDER);
            const opacitySlider = Utils.getElementById(CONFIG.ELEMENTS.OPACITY_SLIDER);

            if (sliceSlider) {
                sliceSlider.addEventListener('input', function(e) {
                    self.currentSlice = parseInt(e.target.value);
                    self.renderSlice();
                });
            }

            if (opacitySlider) {
                opacitySlider.addEventListener('input', function(e) {
                    self.labelOpacity = e.target.value / 100;
                    const opacityValue = Utils.getElementById(CONFIG.ELEMENTS.OPACITY_VALUE);
                    if (opacityValue) {
                        opacityValue.textContent = e.target.value + '%';
                    }
                    self.renderSlice();
                });
            }
        },

        setupZoomControls: function() {
            const self = this;
            console.log('Setting up zoom controls...');

            const panToolBtn = Utils.getElementById(CONFIG.ELEMENTS.PAN_TOOL);
            const zoomInBtn = Utils.getElementById(CONFIG.ELEMENTS.ZOOM_IN);
            const zoomOutBtn = Utils.getElementById(CONFIG.ELEMENTS.ZOOM_OUT);
            const resetViewBtn = Utils.getElementById(CONFIG.ELEMENTS.RESET_VIEW);

            console.log('Navigation buttons found:', {
                panTool: !!panToolBtn,
                zoomIn: !!zoomInBtn,
                zoomOut: !!zoomOutBtn,
                resetView: !!resetViewBtn
            });

            if (panToolBtn) {
                panToolBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Pan tool clicked');
                    self.setAnnotationMode(null); // Clear annotation mode to enable panning
                });
            }

            if (zoomInBtn) {
                zoomInBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Zoom in clicked');
                    self.setAnnotationMode(null); // Clear annotation mode
                    self.zoomIn();
                });
            }

            if (zoomOutBtn) {
                zoomOutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Zoom out clicked');
                    self.setAnnotationMode(null); // Clear annotation mode
                    self.zoomOut();
                });
            }

            if (resetViewBtn) {
                resetViewBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Reset view clicked');
                    self.setAnnotationMode(null); // Clear annotation mode
                    self.resetView();
                });
            }
        },

        setupAnnotationTools: function() {
            const self = this;
            const drawTool = Utils.getElementById(CONFIG.ELEMENTS.DRAW_TOOL);
            const eraseTool = Utils.getElementById(CONFIG.ELEMENTS.ERASE_TOOL);
            const commentTool = Utils.getElementById(CONFIG.ELEMENTS.COMMENT_TOOL);
            const clearAnnotations = Utils.getElementById(CONFIG.ELEMENTS.CLEAR_ANNOTATIONS);
            const colorPicker = Utils.getElementById(CONFIG.ELEMENTS.COLOR_PICKER);

            if (drawTool) {
                drawTool.addEventListener('click', function() {
                    self.setAnnotationMode('draw');
                });
            }

            if (eraseTool) {
                eraseTool.addEventListener('click', function() {
                    self.setAnnotationMode('erase');
                });
            }

            if (commentTool) {
                commentTool.addEventListener('click', function() {
                    self.setAnnotationMode('comment');
                    self.toggleCommentsPanel();
                });
            }

            if (clearAnnotations) {
                clearAnnotations.addEventListener('click', function() {
                    self.clearCurrentSliceAnnotations();
                });
            }

            if (colorPicker) {
                colorPicker.addEventListener('change', function(e) {
                    self.drawingColor = e.target.value;
                    console.log('Drawing color changed to:', self.drawingColor);
                });
            }
        },

        setupViewerControlsHover: function() {
            const viewerControls = Utils.getElementById(CONFIG.ELEMENTS.VIEWER_CONTROLS);
            const container = Utils.getElementById(CONFIG.ELEMENTS.CANVAS_CONTAINER);

            if (viewerControls && container) {
                container.addEventListener('mouseenter', function() {
                    viewerControls.style.opacity = '1';
                });

                container.addEventListener('mouseleave', function() {
                    viewerControls.style.opacity = '0.3';
                });
            }
        },

        showReportButton: function() {
            const self = this;
            const reportBtn = Utils.getElementById(CONFIG.ELEMENTS.REPORT_BTN);
            const refreshBtn = Utils.getElementById(CONFIG.ELEMENTS.REFRESH_BTN);

            if (reportBtn) {
                reportBtn.style.display = 'block';
                reportBtn.addEventListener('click', function() {
                    window.open(self.generateReportHTML(), '_blank');
                });
            }

            if (refreshBtn) {
                refreshBtn.style.display = 'block';
                refreshBtn.addEventListener('click', function() {
                    self.startFresh();
                });

                // Initialize Bootstrap tooltip
                if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
                    new bootstrap.Tooltip(refreshBtn);
                }
            }
        },

        startFresh: function() {
            console.log('Starting fresh - clearing all project data...');

            // === Force finish any pending annotations ===
            if (this.segmentationViewer && this.segmentationViewer.isAnnotating) {
                this.segmentationViewer.isAnnotating = false;
                console.log('Forced stop of pending annotation');
            }

            // === Clear ALL localStorage data ===
            // Clear specific known keys
            localStorage.removeItem('hema-comments');
            localStorage.removeItem('hema-slice-ratings');
            localStorage.removeItem('hema-annotations');
            localStorage.removeItem('hema-slice-vector-annotations');
            localStorage.removeItem('hema-slice-images');

            // Clear any other hema-related data that might exist
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('hema-')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => {
                console.log('Removing localStorage key:', key);
                localStorage.removeItem(key);
            });

            // === Clear in-memory data ===
            // Reset slice ratings
            this.sliceRatings = {};

            // === Clear ALL slice annotations using proper method ===
            if (this.segmentationViewer) {
                console.log('=== CLEARING ALL SLICE ANNOTATIONS ===');

                // Get all slice numbers that have annotations
                const annotatedSlices = this.segmentationViewer.sliceAnnotations ?
                    Object.keys(this.segmentationViewer.sliceAnnotations) : [];
                console.log('Found annotations on slices:', annotatedSlices);

                // Clear annotations from ALL slices (not just current slice)
                if (this.segmentationViewer.sliceAnnotations) {
                    Object.keys(this.segmentationViewer.sliceAnnotations).forEach(sliceNum => {
                        console.log('Clearing annotations for slice:', sliceNum);
                        delete this.segmentationViewer.sliceAnnotations[sliceNum];
                    });
                    console.log('All slice annotations cleared from memory');
                }

                // Clear the annotation canvas completely
                if (this.segmentationViewer.annotationCtx && this.segmentationViewer.annotationCanvas) {
                    this.segmentationViewer.annotationCtx.clearRect(0, 0,
                        this.segmentationViewer.annotationCanvas.width,
                        this.segmentationViewer.annotationCanvas.height);
                    console.log('Annotation canvas cleared');
                }

                // Reset all annotation-related variables
                this.segmentationViewer.currentDrawingCoords = null;
                this.segmentationViewer.isAnnotating = false;

                // Force save the cleared annotations to localStorage
                if (typeof this.segmentationViewer.saveSliceAnnotations === 'function') {
                    this.segmentationViewer.saveSliceAnnotations();
                    console.log('Empty annotations saved to localStorage');
                }

                // Clear annotation mode
                if (typeof this.segmentationViewer.setAnnotationMode === 'function') {
                    this.segmentationViewer.setAnnotationMode(null);
                }

                // Clear current drawing data
                if (this.segmentationViewer.currentDrawingCoords) {
                    this.segmentationViewer.currentDrawingCoords = [];
                }
                if (this.segmentationViewer.isAnnotating) {
                    this.segmentationViewer.isAnnotating = false;
                }

                // Force save empty data to prevent restoration from cache
                if (typeof this.segmentationViewer.saveRatings === 'function') {
                    this.segmentationViewer.saveRatings();
                }
            }

            // === Force save empty data structures ===
            // Save empty ratings
            if (typeof this.saveRatings === 'function') {
                this.saveRatings();
            }

            // Force save empty data structures to localStorage - MULTIPLE ATTEMPTS
            localStorage.setItem('hema-comments', JSON.stringify([]));
            localStorage.setItem('hema-slice-images', JSON.stringify({}));
            localStorage.setItem('hema-slice-vector-annotations', JSON.stringify({}));
            localStorage.setItem('hema-slice-ratings', JSON.stringify({}));

            // Verify clearing with delay to handle async operations
            setTimeout(() => {
                console.log('=== VERIFICATION AFTER DELAY ===');
                console.log('localStorage hema-slice-vector-annotations:', localStorage.getItem('hema-slice-vector-annotations'));
                console.log('localStorage hema-slice-ratings:', localStorage.getItem('hema-slice-ratings'));
                console.log('In-memory sliceAnnotations keys:', this.segmentationViewer ? Object.keys(this.segmentationViewer.sliceAnnotations || {}).length : 'N/A');
            }, 200);

            // === Clear all canvas drawings ===
            if (this.segmentationViewer && this.segmentationViewer.annotationCanvas) {
                const ctx = this.segmentationViewer.annotationCanvas.getContext('2d');
                ctx.clearRect(0, 0, this.segmentationViewer.annotationCanvas.width, this.segmentationViewer.annotationCanvas.height);
            }

            // === Reset UI elements ===
            // Clear comments display
            const commentsList = Utils.getElementById(CONFIG.ELEMENTS.COMMENTS_LIST);
            if (commentsList) {
                commentsList.innerHTML = '<p class="text-muted mb-0">No comments for this slice</p>';
            }

            // Clear comment input
            const commentInput = Utils.getElementById(CONFIG.ELEMENTS.COMMENT_INPUT);
            if (commentInput) {
                commentInput.value = '';
            }

            // Clear rating display
            const ratingDisplay = Utils.getElementById(CONFIG.ELEMENTS.RATING_DISPLAY);
            if (ratingDisplay) {
                ratingDisplay.textContent = '0/10';
            }

            // Reset star rating to 0
            if (typeof this.highlightStars === 'function') {
                this.highlightStars(0);
            }

            // Clear any active tool selections
            const toolButtons = ['panTool', 'drawTool', 'eraseTool', 'commentTool'];
            toolButtons.forEach(buttonId => {
                const btn = Utils.getElementById(buttonId);
                if (btn) {
                    btn.classList.remove('active');
                }
            });

            // === Re-render and update display ===
            // Force clear canvas again and re-render multiple times to ensure clean state
            if (this.segmentationViewer && this.segmentationViewer.annotationCanvas) {
                const ctx = this.segmentationViewer.annotationCanvas.getContext('2d');
                ctx.clearRect(0, 0, this.segmentationViewer.annotationCanvas.width, this.segmentationViewer.annotationCanvas.height);
                console.log('Canvas cleared again before re-render');
            }

            // Re-render current slice to update display (without annotations)
            if (this.segmentationViewer && typeof this.segmentationViewer.renderSlice === 'function') {
                this.segmentationViewer.renderSlice();
                console.log('Slice re-rendered after clearing');

                // Re-render again after a delay to ensure all annotations are gone
                setTimeout(() => {
                    this.segmentationViewer.renderSlice();
                    console.log('Final re-render completed');
                }, 300);
            }

            // Update star display
            if (typeof this.updateStarDisplay === 'function') {
                this.updateStarDisplay();
            }

            // Hide report button (keep refresh button visible)
            const reportBtn = Utils.getElementById(CONFIG.ELEMENTS.REPORT_BTN);
            if (reportBtn) {
                reportBtn.style.display = 'none';
            }

            // === Final verification ===
            console.log('=== PROJECT RESET VERIFICATION ===');
            const remainingKeys = Object.keys(localStorage).filter(k => k.startsWith('hema-'));
            console.log('Remaining localStorage keys:', remainingKeys);
            console.log('Current sliceRatings count:', Object.keys(this.sliceRatings).length);

            if (this.segmentationViewer && this.segmentationViewer.sliceAnnotations) {
                const annotationCount = Object.keys(this.segmentationViewer.sliceAnnotations).length;
                console.log('Current sliceAnnotations count:', annotationCount);
            }

            // === Provide substantial visual feedback ===
            // Update the page title to show reset status
            document.title = 'HEMA - Fresh Start Complete';

            // Show a comprehensive modal-style confirmation
            this.showComprehensiveResetConfirmation();

            // Reset page title after delay
            setTimeout(() => {
                document.title = 'HEMA - Human Evaluation of Medical AI';
            }, 3000);
        },

        showComprehensiveResetConfirmation: function() {
            // Create a comprehensive modal-style confirmation overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: fadeIn 0.3s ease-in;
            `;

            const modal = document.createElement('div');
            modal.style.cssText = `
                background: white;
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.4s ease-out;
            `;

            modal.innerHTML = `
                <div style="color: #28a745; font-size: 60px; margin-bottom: 20px;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 style="color: #333; margin-bottom: 20px; font-weight: bold;">
                    🎉 Fresh Start Complete!
                </h2>
                <div style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    <p><strong>✅ All annotations cleared from all slices</strong></p>
                    <p><strong>✅ All comments and ratings removed</strong></p>
                    <p><strong>✅ All cached data deleted</strong></p>
                    <p><strong>✅ Canvas completely reset</strong></p>
                    <br>
                    <p style="color: #28a745; font-weight: bold;">
                        Ready for a new evaluation session!
                    </p>
                </div>
                <button id="resetOkButton" style="
                    background: linear-gradient(135deg, #28a745, #20c997);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: transform 0.2s;
                " onmouseover="this.style.transform='scale(1.05)'"
                   onmouseout="this.style.transform='scale(1)'">
                    Continue
                </button>
            `;

            // Add CSS animations
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Handle click to close
            const closeModal = () => {
                overlay.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    document.head.removeChild(style);
                }, 300);
            };

            // Close on button click or overlay click
            modal.querySelector('#resetOkButton').addEventListener('click', closeModal);
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal();
            });

            // Auto-close after 5 seconds
            setTimeout(closeModal, 5000);

            // Add fadeOut animation
            style.textContent += `
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `;
        },

        showNotification: function(message, type = 'info') {
            try {
                // Create and show a temporary notification
                const notification = document.createElement('div');
                notification.className = `alert alert-${type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed`;
                notification.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
                notification.innerHTML = `
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;

                document.body.appendChild(notification);

                // Auto-remove after 3 seconds
                setTimeout(() => {
                    if (notification && notification.parentNode) {
                        notification.remove();
                    }
                }, 3000);
            } catch (error) {
                console.error('Error showing notification:', error);
            }
        },

        generateReportHTML: function() {
            const comments = JSON.parse(localStorage.getItem('hema-comments') || '[]');

            // Get comprehensive data for all evaluated slices
            const evaluatedSlices = this.getAllEvaluatedSliceData();

            const reportHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HEMA Medical Report</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <style>
        .slice-section { page-break-inside: avoid; margin-bottom: 2rem; }
        .comment-item { background: #f8f9fa; padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 0.375rem; }
        @media print { .no-print { display: none !important; } }
    </style>
</head>
<body>
    <div class="container-fluid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4 no-print">
            <h1 class="h3 mb-0"><i class="fas fa-file-medical me-2 text-primary"></i>HEMA Medical Report</h1>
            <button onclick="exportToPDF()" class="btn btn-primary">
                <i class="fas fa-file-pdf me-2"></i>Export PDF
            </button>
        </div>

        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Analysis Report</h5>
                    </div>
                    <div class="card-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                            </div>
                            <div class="col-md-6">
                                <strong>Total Comments:</strong> ${comments.length}
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Evaluated Slices:</strong> ${this.getEvaluatedSlicesCount()}
                            </div>
                            <div class="col-md-6">
                                <strong>Average Rating:</strong> ${this.getAverageRatingDisplay()}
                            </div>
                        </div>
                    </div>
                </div>

                ${Object.keys(evaluatedSlices).length > 0 ?
                    Object.entries(evaluatedSlices)
                        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                        .map(([sliceNum, sliceData]) => `
                        <div class="slice-section">
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">Slice ${sliceData.sliceNumber + 1}${sliceData.hasRating ? ` - Rating: ${sliceData.rating}/10` : ''}</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        ${sliceData.sliceImage ? `
                                        <div class="col-md-5">
                                            <div class="text-center mb-3">
                                                <img src="${sliceData.sliceImage}"
                                                     alt="Slice ${sliceData.sliceNumber + 1}"
                                                     class="img-fluid border"
                                                     style="max-height: 200px; background: #f8f9fa; border-radius: 4px;">
                                                <small class="d-block text-muted mt-1">Medical Image${sliceData.hasComments ? ' with Annotations' : ''}</small>
                                            </div>
                                        </div>
                                        <div class="col-md-7">
                                        ` : '<div class="col-12">'}
                                            ${sliceData.hasComments ?
                                                sliceData.comments.map(comment => `
                                                    <div class="comment-item">
                                                        <div class="d-flex justify-content-between">
                                                            <small class="text-muted">${new Date(comment.timestamp).toLocaleString()}</small>
                                                        </div>
                                                        <div class="mt-1">${comment.text}</div>
                                                    </div>
                                                `).join('') :
                                                '<div class="text-muted"><em>No comments for this slice.</em></div>'
                                            }
                                            ${sliceData.hasRating && !sliceData.hasComments ?
                                                `<div class="text-muted"><em>Rated ${sliceData.rating}/10 - No additional comments.</em></div>` : ''
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('') :
                    '<div class="alert alert-info">No slices have been evaluated yet.</div>'
                }
            </div>

            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Summary</h6>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between mb-2">
                            <span>Total Comments:</span>
                            <span class="badge bg-primary">${comments.length}</span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Slices with Comments:</span>
                            <span class="badge bg-success">${comments.length > 0 ? Object.keys(evaluatedSlices).filter(s => evaluatedSlices[s].hasComments).length : 0}</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Completion:</span>
                            <span class="badge bg-info">${this.imageData ? Math.round((Object.keys(evaluatedSlices).length / this.imageData.sizes[2]) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function exportToPDF() {
            // Use the main PDF generation function
            if (window.HEMAApp && window.HEMAApp.generatePDFReport) {
                window.HEMAApp.generatePDFReport();
            } else {
                console.error('PDF generation function not available');
                alert('PDF generation is not available. Please try refreshing the page.');
            }
        }
    </script>
</body>
</html>`;

            const blob = new Blob([reportHTML], { type: 'text/html' });
            return URL.createObjectURL(blob);
        },

        setAnnotationMode: function(mode) {
            this.annotationMode = mode;
            console.log('Annotation mode set to:', mode);

            // Update button states
            const buttons = [
                CONFIG.ELEMENTS.PAN_TOOL,
                CONFIG.ELEMENTS.DRAW_TOOL,
                CONFIG.ELEMENTS.ERASE_TOOL,
                CONFIG.ELEMENTS.COMMENT_TOOL
            ];

            buttons.forEach(buttonId => {
                const btn = Utils.getElementById(buttonId);
                if (btn) {
                    btn.classList.remove('active');
                    if ((buttonId === CONFIG.ELEMENTS.PAN_TOOL && mode === null) ||
                        (buttonId === CONFIG.ELEMENTS.DRAW_TOOL && mode === 'draw') ||
                        (buttonId === CONFIG.ELEMENTS.ERASE_TOOL && mode === 'erase') ||
                        (buttonId === CONFIG.ELEMENTS.COMMENT_TOOL && mode === 'comment')) {
                        btn.classList.add('active');
                    }
                }
            });

            // Update cursor for annotation modes and canvas pointer events
            const container = Utils.getElementById(CONFIG.ELEMENTS.CANVAS_CONTAINER);
            if (container && this.annotationCanvas) {
                if (mode === 'draw' || mode === 'erase') {
                    container.style.cursor = mode === 'draw' ? 'crosshair' : 'crosshair';
                    this.annotationCanvas.style.pointerEvents = 'auto';
                } else {
                    container.style.cursor = 'grab';
                    this.annotationCanvas.style.pointerEvents = 'none';
                }
            }
        },

        // Helper function to convert screen coordinates to image coordinates
        screenToImageCoords: function(screenX, screenY) {
            const rect = this.annotationCanvas.getBoundingClientRect();
            const canvasX = screenX - rect.left;
            const canvasY = screenY - rect.top;

            // Convert from canvas coordinates to image coordinates accounting for zoom/pan
            const centerX = this.annotationCanvas.width / 2;
            const centerY = this.annotationCanvas.height / 2;

            // Reverse the transformation applied in renderSlice
            const imageX = (canvasX - centerX - this.panX) / this.zoom + this.imageWidth / 2;
            const imageY = (canvasY - centerY - this.panY) / this.zoom + this.imageHeight / 2;

            return { x: imageX, y: imageY };
        },

        // Helper function to convert image coordinates to canvas coordinates
        imageToCanvasCoords: function(imageX, imageY) {
            const centerX = this.annotationCanvas.width / 2;
            const centerY = this.annotationCanvas.height / 2;

            // Apply the same transformation as in renderSlice
            const canvasX = (imageX - this.imageWidth / 2) * this.zoom + centerX + this.panX;
            const canvasY = (imageY - this.imageHeight / 2) * this.zoom + centerY + this.panY;

            return { x: canvasX, y: canvasY };
        },

        startAnnotation: function(e) {
            if (!this.annotationMode || this.annotationMode === 'comment') return;

            this.isAnnotating = true;
            console.log('Starting annotation:', this.annotationMode);

            // Convert screen coordinates to image coordinates
            const imageCoords = this.screenToImageCoords(e.clientX, e.clientY);

            // Store the image coordinates for this drawing session
            this.currentDrawingCoords = [imageCoords];

            // Convert back to canvas coordinates for drawing
            const canvasCoords = this.imageToCanvasCoords(imageCoords.x, imageCoords.y);

            // Start drawing path
            this.annotationCtx.beginPath();
            this.annotationCtx.moveTo(canvasCoords.x, canvasCoords.y);

            // Set drawing properties
            this.annotationCtx.strokeStyle = this.drawingColor;
            this.annotationCtx.lineWidth = this.brushSize;
            this.annotationCtx.lineCap = 'round';
            this.annotationCtx.lineJoin = 'round';

            if (this.annotationMode === 'erase') {
                this.annotationCtx.globalCompositeOperation = 'destination-out';
            } else {
                this.annotationCtx.globalCompositeOperation = 'source-over';
            }
        },

        continueAnnotation: function(e) {
            if (!this.isAnnotating) return;

            // Convert screen coordinates to image coordinates
            const imageCoords = this.screenToImageCoords(e.clientX, e.clientY);

            // Store the image coordinates
            this.currentDrawingCoords.push(imageCoords);

            // Convert to canvas coordinates for drawing
            const canvasCoords = this.imageToCanvasCoords(imageCoords.x, imageCoords.y);

            // Set drawing properties each time to ensure they're not lost
            this.annotationCtx.strokeStyle = this.drawingColor;
            this.annotationCtx.lineWidth = this.brushSize;
            this.annotationCtx.lineCap = 'round';
            this.annotationCtx.lineJoin = 'round';

            // Set composite operation based on mode
            if (this.annotationMode === 'erase') {
                this.annotationCtx.globalCompositeOperation = 'destination-out';
            } else {
                this.annotationCtx.globalCompositeOperation = 'source-over';
            }

            // Draw line to current position
            this.annotationCtx.lineTo(canvasCoords.x, canvasCoords.y);
            this.annotationCtx.stroke();
        },

        endAnnotation: function(e) {
            if (!this.isAnnotating) return;

            this.isAnnotating = false;
            console.log('Ending annotation:', this.annotationMode);

            // Finalize the path
            this.annotationCtx.closePath();

            // Save the vector annotation data for this slice
            this.saveCurrentDrawingAsVector();
        },

        showReportSection: function() {
            const self = this;
            const reportSection = Utils.getElementById(CONFIG.ELEMENTS.REPORT_SECTION);
            const generateBtn = Utils.getElementById(CONFIG.ELEMENTS.GENERATE_REPORT_BTN);

            if (reportSection) {
                reportSection.style.display = 'block';
            }

            if (generateBtn) {
                generateBtn.addEventListener('click', function() {
                    self.exportToPDF();
                });

                // Add hover effects for the modern button
                generateBtn.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                });

                generateBtn.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                });
            }
        },

        clearCurrentSliceAnnotations: function() {
            console.log('Clearing annotations for slice:', this.currentSlice);

            // Clear the visual annotations from canvas
            if (this.annotationCtx) {
                this.annotationCtx.clearRect(0, 0, this.annotationCanvas.width, this.annotationCanvas.height);
            }

            // Remove annotations from stored data for current slice
            if (this.sliceAnnotations && this.sliceAnnotations[this.currentSlice]) {
                delete this.sliceAnnotations[this.currentSlice];
                console.log('Deleted stored annotations for slice:', this.currentSlice);
            }

            // Save the updated annotations to localStorage
            this.saveSliceAnnotations();

            console.log('Annotations permanently cleared for slice:', this.currentSlice);
        },

        toggleCommentsPanel: function() {
            const panel = Utils.getElementById(CONFIG.ELEMENTS.COMMENTS_PANEL);
            console.log('Toggling comments panel:', panel);

            if (panel) {
                const isVisible = panel.style.display !== 'none';
                console.log('Panel visible?', isVisible);

                panel.style.display = isVisible ? 'none' : 'block';
                console.log('Panel display set to:', panel.style.display);

                if (!isVisible) {
                    console.log('Setting up comments panel...');
                    this.setupCommentsPanel();
                    this.loadSliceComments();
                }
            } else {
                console.error('Comments panel not found!');
            }
        },

        setupCommentsPanel: function() {
            const self = this;

            // Use setTimeout to ensure DOM is ready
            setTimeout(function() {
                const addCommentBtn = Utils.getElementById(CONFIG.ELEMENTS.ADD_COMMENT);
                const commentInput = Utils.getElementById(CONFIG.ELEMENTS.COMMENT_INPUT);
                const closeBtn = Utils.getElementById(CONFIG.ELEMENTS.CLOSE_COMMENTS);

                console.log('Setting up comments panel:', {
                    addBtn: !!addCommentBtn,
                    input: !!commentInput,
                    closeBtn: !!closeBtn
                });

                if (addCommentBtn && commentInput) {
                    // Remove any existing listeners first
                    addCommentBtn.replaceWith(addCommentBtn.cloneNode(true));
                    const newAddBtn = Utils.getElementById(CONFIG.ELEMENTS.ADD_COMMENT);

                    newAddBtn.addEventListener('click', function() {
                        console.log('Add comment button clicked');
                        self.addComment();
                    });

                    commentInput.addEventListener('keypress', function(e) {
                        console.log('Key pressed in comment input:', e.key);
                        if (e.key === 'Enter') {
                            self.addComment();
                        }
                    });

                    // Add input event listener for dynamic icon change
                    commentInput.addEventListener('input', function(e) {
                        self.updateCommentButtonIcon(e.target.value.trim());
                    });

                    // Add focus and blur events
                    commentInput.addEventListener('focus', function() {
                        if (commentInput.value.trim()) {
                            self.updateCommentButtonIcon(commentInput.value.trim());
                        }
                    });

                    commentInput.addEventListener('blur', function() {
                        if (!commentInput.value.trim()) {
                            self.updateCommentButtonIcon('');
                        }
                    });

                    // Focus the input
                    commentInput.focus();
                    console.log('Comment input focused');
                }

                if (closeBtn) {
                    closeBtn.addEventListener('click', function() {
                        self.toggleCommentsPanel();
                    });
                }
            }, 100);
        },

        updateCommentButtonIcon: function(inputValue) {
            const addBtn = Utils.getElementById(CONFIG.ELEMENTS.ADD_COMMENT);
            if (addBtn) {
                const icon = addBtn.querySelector('i');
                if (icon) {
                    if (inputValue) {
                        // Show check icon when typing
                        icon.className = 'fas fa-check';
                        addBtn.className = 'btn btn-success btn-sm';
                        addBtn.title = 'Accept Comment';
                    } else {
                        // Show plus icon when empty
                        icon.className = 'fas fa-plus';
                        addBtn.className = 'btn btn-primary btn-sm';
                        addBtn.title = 'Add Comment';
                    }
                }
            }
        },

        addComment: function() {
            const commentInput = Utils.getElementById(CONFIG.ELEMENTS.COMMENT_INPUT);
            if (commentInput && commentInput.value.trim()) {
                const comment = {
                    text: commentInput.value.trim(),
                    slice: this.currentSlice,
                    timestamp: new Date().toISOString(),
                    id: Date.now()
                };

                // Save to browser storage (will implement database later)
                this.saveComment(comment);

                // Add to UI
                this.displayComment(comment);

                // Clear input and reset icon
                commentInput.value = '';
                this.updateCommentButtonIcon('');

                console.log('Comment added:', comment);
            }
        },

        captureSliceImage: function() {
            // Create a temporary canvas to combine both image and label layers
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.imageCanvas.width;
            tempCanvas.height = this.imageCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');

            // Draw the image canvas first
            tempCtx.drawImage(this.imageCanvas, 0, 0);

            // Draw the label canvas on top (if visible)
            if (this.labelOpacity > 0) {
                tempCtx.globalAlpha = this.labelOpacity;
                tempCtx.drawImage(this.labelCanvas, 0, 0);
                tempCtx.globalAlpha = 1;
            }

            // Convert to base64 image data
            return tempCanvas.toDataURL('image/png');
        },

        captureSliceImageForPDF: function() {
            // Create a temporary canvas to combine both image and label layers
            const tempCanvas = document.createElement('canvas');

            // Use the actual canvas dimensions to maintain aspect ratio
            const sourceWidth = this.imageCanvas.width;
            const sourceHeight = this.imageCanvas.height;

            // Set canvas to actual dimensions (no stretching)
            tempCanvas.width = sourceWidth;
            tempCanvas.height = sourceHeight;
            const tempCtx = tempCanvas.getContext('2d');

            // Fill with white background
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, sourceWidth, sourceHeight);

            // Draw the image canvas first (1:1 ratio)
            tempCtx.drawImage(this.imageCanvas, 0, 0);

            // Draw the label canvas on top (if visible)
            if (this.labelOpacity > 0) {
                tempCtx.globalAlpha = this.labelOpacity;
                tempCtx.drawImage(this.labelCanvas, 0, 0);
                tempCtx.globalAlpha = 1;
            }

            // Draw annotations on top (if visible)
            if (this.annotationCanvas) {
                tempCtx.drawImage(this.annotationCanvas, 0, 0);
            }

            // Convert to base64 image data
            return tempCanvas.toDataURL('image/png');
        },

        saveComment: function(comment) {
            // Capture current slice image with annotations
            // Capture and save slice image for report
            this.captureAndSaveSliceImage(this.currentSlice);
            comment.sliceImage = this.getSliceImage(this.currentSlice);
            comment.sliceImageDimensions = {
                width: this.imageData.sizes[0],
                height: this.imageData.sizes[1]
            };

            // Temporary storage - will implement proper database
            const comments = JSON.parse(localStorage.getItem('hema-comments') || '[]');
            comments.push(comment);
            localStorage.setItem('hema-comments', JSON.stringify(comments));
        },

        loadSliceComments: function() {
            const comments = JSON.parse(localStorage.getItem('hema-comments') || '[]');
            const sliceComments = comments.filter(c => c.slice === this.currentSlice);

            const commentsList = Utils.getElementById(CONFIG.ELEMENTS.COMMENTS_LIST);
            if (commentsList) {
                commentsList.innerHTML = '';
                sliceComments.forEach(comment => this.displayComment(comment));
            }
        },

        displayComment: function(comment) {
            const commentsList = Utils.getElementById(CONFIG.ELEMENTS.COMMENTS_LIST);
            if (commentsList) {
                const commentEl = document.createElement('div');
                commentEl.className = 'comment mb-2 p-2 bg-light rounded';
                commentEl.innerHTML = `
                    <div class="d-flex justify-content-between align-items-start">
                        <small class="text-muted">${new Date(comment.timestamp).toLocaleString()}</small>
                        <button class="btn btn-sm btn-outline-danger btn-xs" onclick="this.parentElement.parentElement.remove();">
                            <i class="fas fa-times" style="font-size: 8px;"></i>
                        </button>
                    </div>
                    <div class="mt-1" style="font-size: 13px;">${comment.text}</div>
                `;
                commentsList.appendChild(commentEl);
            }
        },

        setupCanvasEvents: function() {
            const self = this;
            const container = Utils.getElementById(CONFIG.ELEMENTS.CANVAS_CONTAINER);

            if (!container) return;

            // Mouse events for panning
            container.addEventListener('mousedown', function(e) {
                // Check if annotation mode is active
                if (self.annotationMode && (self.annotationMode === 'draw' || self.annotationMode === 'erase')) {
                    // Handle annotation drawing instead of panning
                    self.startAnnotation(e);
                    return;
                }

                self.isDragging = true;
                self.lastMouseX = e.clientX;
                self.lastMouseY = e.clientY;
                container.style.cursor = 'grabbing';
                e.preventDefault();
            });

            container.addEventListener('mousemove', function(e) {
                // Handle annotation drawing
                if (self.isAnnotating) {
                    self.continueAnnotation(e);
                    return;
                }

                if (!self.isDragging) return;

                const deltaX = e.clientX - self.lastMouseX;
                const deltaY = e.clientY - self.lastMouseY;

                // Improved pan sensitivity - use fixed multiplier instead of dividing by zoom
                const panSensitivity = 1.5; // Adjust this value for better responsiveness
                self.panX += deltaX * panSensitivity;
                self.panY += deltaY * panSensitivity;

                self.lastMouseX = e.clientX;
                self.lastMouseY = e.clientY;

                self.renderSlice();
                e.preventDefault();
            });

            container.addEventListener('mouseup', function(e) {
                // Handle annotation end
                if (self.isAnnotating) {
                    self.endAnnotation(e);
                    return;
                }

                self.isDragging = false;
                container.style.cursor = 'grab';
            });

            container.addEventListener('mouseleave', function(e) {
                self.isDragging = false;
                container.style.cursor = 'grab';
            });

            // Mouse wheel for zooming
            container.addEventListener('wheel', function(e) {
                e.preventDefault();

                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
                const targetZoom = self.zoom * zoomFactor;

                // Use the same professional zoom method
                self.zoomToPoint(mouseX, mouseY, targetZoom);
            });

            // Touch events for mobile support
            let lastTouchDistance = 0;
            let lastTouchX = 0;
            let lastTouchY = 0;

            container.addEventListener('touchstart', function(e) {
                e.preventDefault();
                if (e.touches.length === 1) {
                    // Single touch - start panning
                    self.isDragging = true;
                    self.lastMouseX = e.touches[0].clientX;
                    self.lastMouseY = e.touches[0].clientY;
                } else if (e.touches.length === 2) {
                    // Two touches - start pinch zoom
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    lastTouchDistance = Math.sqrt(
                        Math.pow(touch2.clientX - touch1.clientX, 2) +
                        Math.pow(touch2.clientY - touch1.clientY, 2)
                    );
                    lastTouchX = (touch1.clientX + touch2.clientX) / 2;
                    lastTouchY = (touch1.clientY + touch2.clientY) / 2;
                    self.isDragging = false;
                }
            });

            container.addEventListener('touchmove', function(e) {
                e.preventDefault();
                if (e.touches.length === 1 && self.isDragging) {
                    // Single touch - pan
                    const deltaX = e.touches[0].clientX - self.lastMouseX;
                    const deltaY = e.touches[0].clientY - self.lastMouseY;

                    // Improved touch pan sensitivity
                    const panSensitivity = 1.5;
                    self.panX += deltaX * panSensitivity;
                    self.panY += deltaY * panSensitivity;

                    self.lastMouseX = e.touches[0].clientX;
                    self.lastMouseY = e.touches[0].clientY;

                    self.renderSlice();
                } else if (e.touches.length === 2) {
                    // Two touches - pinch zoom
                    const touch1 = e.touches[0];
                    const touch2 = e.touches[1];
                    const currentDistance = Math.sqrt(
                        Math.pow(touch2.clientX - touch1.clientX, 2) +
                        Math.pow(touch2.clientY - touch1.clientY, 2)
                    );

                    if (lastTouchDistance > 0) {
                        const zoomFactor = currentDistance / lastTouchDistance;
                        const newZoom = Utils.clamp(self.zoom * zoomFactor, self.minZoom, self.maxZoom);

                        if (newZoom !== self.zoom) {
                            const rect = container.getBoundingClientRect();
                            const centerX = lastTouchX - rect.left;
                            const centerY = lastTouchY - rect.top;

                            const zoomRatio = newZoom / self.zoom;
                            self.panX = centerX - (centerX - self.panX) * zoomRatio;
                            self.panY = centerY - (centerY - self.panY) * zoomRatio;
                            self.zoom = newZoom;

                            self.renderSlice();
                            self.updateZoomInfo();
                        }
                    }
                    lastTouchDistance = currentDistance;
                }
            });

            container.addEventListener('touchend', function(e) {
                self.isDragging = false;
                lastTouchDistance = 0;
            });

            // Set initial cursor
            container.style.cursor = 'grab';
        },

        updateZoomInfo: function() {
            // Update zoom display if element exists
            const zoomValue = Utils.getElementById(CONFIG.ELEMENTS.ZOOM_VALUE);
            if (zoomValue) {
                zoomValue.textContent = Math.round(this.zoom * 100) + '%';
            }
        },

        fitToContainer: function() {
            if (!this.imageData) return;

            const container = Utils.getElementById(CONFIG.ELEMENTS.CANVAS_CONTAINER);
            if (!container) return;

            // Get container dimensions
            const containerRect = container.getBoundingClientRect();
            this.containerWidth = containerRect.width || 800;
            this.containerHeight = containerRect.height || 600;

            // Calculate best fit zoom
            this.imageWidth = this.imageData.sizes[0];
            this.imageHeight = this.imageData.sizes[1];

            console.log('Container dimensions:', this.containerWidth, 'x', this.containerHeight);
            console.log('Image dimensions:', this.imageWidth, 'x', this.imageHeight);

            // Calculate scale factors with some padding
            const padding = 40; // 20px on each side
            const availableWidth = this.containerWidth - padding;
            const availableHeight = this.containerHeight - padding;

            const scaleX = availableWidth / this.imageWidth;
            const scaleY = availableHeight / this.imageHeight;

            // Use the smaller scale to ensure image fits entirely
            const bestFitZoom = Math.min(scaleX, scaleY);

            console.log('Scale factors:', 'X:', scaleX, 'Y:', scaleY, 'Best fit:', bestFitZoom);

            this.zoom = bestFitZoom;
            // Reset pan to center the image
            this.panX = 0;
            this.panY = 0;

            console.log('Auto-fit zoom:', Math.round(this.zoom * 100) + '%', 'Raw zoom:', this.zoom);
            this.updateZoomInfo();
        },

        resetView: function() {
            this.fitToContainer();
            this.renderSlice();
            this.updateZoomInfo();
        },

        zoomIn: function() {
            this.zoomToPoint(this.containerWidth / 2, this.containerHeight / 2, this.zoom * 1.2);
        },

        zoomOut: function() {
            this.zoomToPoint(this.containerWidth / 2, this.containerHeight / 2, this.zoom * 0.8);
        },

        zoomToPoint: function(pointX, pointY, targetZoom) {
            const newZoom = Utils.clamp(targetZoom, this.minZoom, this.maxZoom);
            if (newZoom === this.zoom) return;

            // Calculate the world position that the point is currently showing
            const worldX = (pointX - this.containerWidth / 2 - this.panX) / this.zoom;
            const worldY = (pointY - this.containerHeight / 2 - this.panY) / this.zoom;

            // Update zoom
            this.zoom = newZoom;

            // Calculate new pan to keep the same world position under the point
            this.panX = pointX - this.containerWidth / 2 - worldX * this.zoom;
            this.panY = pointY - this.containerHeight / 2 - worldY * this.zoom;

            console.log('Zoom to:', Math.round(this.zoom * 100) + '%', 'Pan:', Math.round(this.panX), Math.round(this.panY));

            this.renderSlice();
            this.updateZoomInfo();
        },

        loadData: function(imageData, labelData) {
            console.log('Loading segmentation data');

            this.imageData = imageData;
            this.labelData = labelData;

            // Validate dimensions
            if (!this.validateDimensions()) {
                throw new Error('Image and label dimensions do not match');
            }

            this.detectCategories();
            this.setupViewer();
        },

        validateDimensions: function() {
            if (!this.imageData || !this.labelData) return false;
            return this.imageData.sizes.join(',') === this.labelData.sizes.join(',');
        },

        detectCategories: function() {
            console.log('Detecting label categories');
            const uniqueValues = new Set();
            const data = this.labelData.data;
            const chunkSize = 100000;

            // Sample data in chunks for performance
            for (let i = 0; i < data.length; i += chunkSize) {
                const end = Math.min(i + chunkSize, data.length);
                for (let j = i; j < end; j++) {
                    uniqueValues.add(data[j]);
                }
            }

            this.labelCategories = Array.from(uniqueValues).sort(function(a, b) { return a - b; });
            console.log('Label categories detected:', this.labelCategories);
        },

        setupViewer: function() {
            console.log('Setting up segmentation viewer');

            const sizes = this.imageData.sizes;
            const width = sizes[0];
            const height = sizes[1];
            const depth = sizes[2];

            // Set container to flexible dimensions for zoom/pan
            const container = Utils.getElementById(CONFIG.ELEMENTS.CANVAS_CONTAINER);
            if (container) {
                // Make container flexible and add viewport styles
                container.style.width = '100%';
                container.style.height = '500px';
                container.style.maxWidth = '100%';
                container.style.overflow = 'hidden';
                container.style.position = 'relative';
                container.style.border = '2px solid #dee2e6';
                container.style.borderRadius = '8px';
                Utils.showElement(container);
            }

            // Set canvas dimensions to match container (not image)
            if (this.imageCanvas && this.labelCanvas && container) {
                // Set CSS size first
                this.imageCanvas.style.width = '100%';
                this.imageCanvas.style.height = '100%';
                this.labelCanvas.style.width = '100%';
                this.labelCanvas.style.height = '100%';

                // Will set actual canvas dimensions after DOM update
                const self = this;
                setTimeout(function() {
                    const containerRect = container.getBoundingClientRect();
                    const canvasWidth = containerRect.width || 800;
                    const canvasHeight = containerRect.height || 500;

                    self.imageCanvas.width = canvasWidth;
                    self.imageCanvas.height = canvasHeight;
                    self.labelCanvas.width = canvasWidth;
                    self.labelCanvas.height = canvasHeight;
                    self.annotationCanvas.width = canvasWidth;
                    self.annotationCanvas.height = canvasHeight;

                    console.log('Canvas sized to container:', canvasWidth, 'x', canvasHeight);
                }, 50);
            }

            // Setup slice slider
            this.setupSliceSlider(depth);

            // Show viewer elements
            this.showViewerElements();

            // Calculate best-fit zoom after DOM update
            const self = this;
            setTimeout(function() {
                self.fitToContainer();
                // Render initial slice with zoom/pan
                self.currentSlice = Math.floor(depth / 2);
                self.renderSlice();
            }, 100);
        },

        setupSliceSlider: function(depth) {
            const sliceSlider = Utils.getElementById(CONFIG.ELEMENTS.SLICE_SLIDER);
            if (sliceSlider) {
                sliceSlider.max = depth - 1;
                sliceSlider.value = Math.floor(depth / 2);
                this.currentSlice = Math.floor(depth / 2);
            }
        },

        showViewerElements: function() {
            Utils.showElement(CONFIG.ELEMENTS.CANVAS_CONTAINER);
            Utils.showElement(CONFIG.ELEMENTS.CONTROLS);
            Utils.hideElement(CONFIG.ELEMENTS.ERROR);

            // Setup zoom controls now that they are visible
            this.setupZoomControls();

            // Setup annotation tools
            this.setupAnnotationTools();

            // Setup star rating system
            this.setupStarRating();

            // Setup hover effects for viewer controls
            this.setupViewerControlsHover();

            // Show report button
            this.showReportButton();

            // Show report section
            this.showReportSection();

            // Add styling class to viewer
            const viewer = Utils.getElementById('viewer');
            if (viewer) {
                Utils.addClassWithAnimation(viewer, 'has-files');
            }
        },

        renderSlice: function() {
            if (!this.imageData || !this.labelData || !this.imageCtx || !this.labelCtx) {
                console.warn('Cannot render slice - missing data or context');
                return;
            }

            const sizes = this.imageData.sizes;
            const imageWidth = sizes[0];
            const imageHeight = sizes[1];
            const sliceSize = imageWidth * imageHeight;
            const offset = this.currentSlice * sliceSize;

            // Clear canvases with full canvas size
            this.imageCtx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
            this.labelCtx.clearRect(0, 0, this.labelCanvas.width, this.labelCanvas.height);

            // Create temporary canvases for image data
            const tempImageCanvas = document.createElement('canvas');
            const tempLabelCanvas = document.createElement('canvas');
            tempImageCanvas.width = imageWidth;
            tempImageCanvas.height = imageHeight;
            tempLabelCanvas.width = imageWidth;
            tempLabelCanvas.height = imageHeight;

            const tempImageCtx = tempImageCanvas.getContext('2d');
            const tempLabelCtx = tempLabelCanvas.getContext('2d');

            // Render to temporary canvases
            this.renderImageSliceToContext(tempImageCtx, offset, imageWidth, imageHeight, sliceSize);
            this.renderLabelSliceToContext(tempLabelCtx, offset, imageWidth, imageHeight, sliceSize);

            // Apply zoom and pan transformations to main canvas
            this.imageCtx.save();
            this.labelCtx.save();

            // Center the transformation around the canvas center
            const centerX = this.imageCanvas.width / 2;
            const centerY = this.imageCanvas.height / 2;

            this.imageCtx.translate(centerX + this.panX, centerY + this.panY);
            this.imageCtx.scale(this.zoom, this.zoom);
            this.imageCtx.translate(-imageWidth / 2, -imageHeight / 2);

            this.labelCtx.translate(centerX + this.panX, centerY + this.panY);
            this.labelCtx.scale(this.zoom, this.zoom);
            this.labelCtx.translate(-imageWidth / 2, -imageHeight / 2);

            // Draw the temporary canvases to main canvases with transformations
            this.imageCtx.drawImage(tempImageCanvas, 0, 0);
            this.labelCtx.drawImage(tempLabelCanvas, 0, 0);

            // Restore transformations
            this.imageCtx.restore();
            this.labelCtx.restore();

            // Update slice info
            this.updateSliceInfo();

            // Redraw annotations for current slice
            this.loadCurrentSliceAnnotation();
        },

        renderImageSliceToContext: function(ctx, offset, width, height, sliceSize) {
            // Normalize image values for better visibility
            let minVal = this.imageData.data[offset];
            let maxVal = this.imageData.data[offset];

            for (let i = 0; i < sliceSize; i++) {
                const value = this.imageData.data[offset + i];
                if (value < minVal) minVal = value;
                if (value > maxVal) maxVal = value;
            }

            const range = maxVal - minVal;

            // Create image buffer
            const imageBuffer = new Uint8ClampedArray(width * height * 4);
            for (let i = 0; i < sliceSize; i++) {
                const rawValue = this.imageData.data[offset + i];
                const normalizedValue = range > 0 ? Math.floor(((rawValue - minVal) / range) * 255) : 0;
                const idx = i * 4;
                imageBuffer[idx] = normalizedValue;     // R
                imageBuffer[idx + 1] = normalizedValue; // G
                imageBuffer[idx + 2] = normalizedValue; // B
                imageBuffer[idx + 3] = 255;             // A
            }

            // Draw to canvas
            ctx.putImageData(new ImageData(imageBuffer, width, height), 0, 0);
        },

        renderLabelSliceToContext: function(ctx, offset, width, height, sliceSize) {
            const labelBuffer = new Uint8ClampedArray(width * height * 4);

            for (let i = 0; i < sliceSize; i++) {
                const value = this.labelData.data[offset + i];
                const idx = i * 4;

                if (value > 0) {
                    // Find category index and map to color
                    const categoryIndex = this.labelCategories.indexOf(value);
                    const colorIndex = Math.max(0, categoryIndex - 1); // Skip background (0)
                    const color = CONFIG.CATEGORY_COLORS[colorIndex % CONFIG.CATEGORY_COLORS.length];

                    labelBuffer[idx] = color[0];     // R
                    labelBuffer[idx + 1] = color[1]; // G
                    labelBuffer[idx + 2] = color[2]; // B
                    labelBuffer[idx + 3] = Math.floor(this.labelOpacity * 255); // A
                } else {
                    // Transparent for background
                    labelBuffer[idx] = 0;     // R
                    labelBuffer[idx + 1] = 0; // G
                    labelBuffer[idx + 2] = 0; // B
                    labelBuffer[idx + 3] = 0; // A
                }
            }

            // Draw to canvas
            ctx.putImageData(new ImageData(labelBuffer, width, height), 0, 0);
        },

        updateSliceInfo: function() {
            const sliceInfo = Utils.getElementById(CONFIG.ELEMENTS.SLICE_INFO);
            if (sliceInfo && this.imageData) {
                sliceInfo.textContent = (this.currentSlice + 1) + '/' + this.imageData.sizes[2];
            }

            // Update star rating display for current slice
            this.updateStarDisplay();

            // Load annotations for current slice
            this.loadCurrentSliceAnnotation();
        },

        captureSliceSnapshot: function(sliceNumber) {
            if (!this.imageData || !this.imageCanvas || !this.annotationCanvas) {
                console.error('Missing required data for snapshot');
                return null;
            }

            // Save current slice
            const originalSlice = this.currentSlice;

            try {
                // Switch to the target slice
                this.currentSlice = sliceNumber;
                this.renderSlice();

                // Create a properly sized canvas for PDF
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');

                // Set a good size for PDF (4:3 ratio)
                const pdfWidth = 400;
                const pdfHeight = 300;
                tempCanvas.width = pdfWidth;
                tempCanvas.height = pdfHeight;

                // Fill with white background
                tempCtx.fillStyle = '#ffffff';
                tempCtx.fillRect(0, 0, pdfWidth, pdfHeight);

                // Calculate scaling to fit the canvas while maintaining aspect ratio
                const sourceWidth = this.imageCanvas.width;
                const sourceHeight = this.imageCanvas.height;

                const scale = Math.min(pdfWidth / sourceWidth, pdfHeight / sourceHeight);
                const scaledWidth = sourceWidth * scale;
                const scaledHeight = sourceHeight * scale;

                // Center the image
                const offsetX = (pdfWidth - scaledWidth) / 2;
                const offsetY = (pdfHeight - scaledHeight) / 2;

                // Draw the image canvas (scaled and centered)
                tempCtx.drawImage(this.imageCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

                // Draw the label canvas if it exists (scaled and centered)
                if (this.labelCanvas) {
                    tempCtx.drawImage(this.labelCanvas, offsetX, offsetY, scaledWidth, scaledHeight);
                }

                // Draw annotations canvas on top (scaled and centered)
                tempCtx.drawImage(this.annotationCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

                console.log('Snapshot captured successfully');
                return tempCanvas.toDataURL('image/png', 0.9);

            } catch (error) {
                console.error('Error capturing snapshot:', error);
                return null;
            } finally {
                // Restore original slice
                this.currentSlice = originalSlice;
                this.renderSlice();
            }
        },




        exportToPDF: function() {
            console.log('Exporting PDF...');

            // Check if jsPDF is available - try multiple access methods
            let jsPDF;
            if (window.jspdf && window.jspdf.jsPDF) {
                jsPDF = window.jspdf.jsPDF;
            } else if (window.jsPDF) {
                jsPDF = window.jsPDF;
            } else if (typeof window.jsPDF !== 'undefined') {
                jsPDF = window.jsPDF;
            } else {
                console.error('jsPDF library not loaded');
                alert('PDF library not loaded. Please refresh the page and try again.');
                return;
            }

            try {
                console.log('jsPDF found, creating document...');
                const doc = new jsPDF();
                const comments = JSON.parse(localStorage.getItem('hema-comments') || '[]');

                console.log('Found comments:', comments.length);

                // Get comprehensive data for all evaluated slices
                const evaluatedSlices = this.getAllEvaluatedSliceData();

                console.log('Evaluated slices:', Object.keys(evaluatedSlices).length);

                // Professional Header
                this.addPDFHeader(doc);

                // Report Summary Section
                const pageWidth = doc.internal.pageSize.getWidth();
                let currentYPos = 70;

                // Summary box
                doc.setFillColor(248, 249, 250); // Light gray background
                doc.rect(20, currentYPos - 5, pageWidth - 40, 55, 'F');
                doc.setDrawColor(71, 85, 105); // Border color
                doc.setLineWidth(0.5);
                doc.rect(20, currentYPos - 5, pageWidth - 40, 55);

                // Summary content
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(30, 41, 59);
                doc.text('EVALUATION SUMMARY', 25, currentYPos + 5);

                doc.setFontSize(11);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(71, 85, 105);
                doc.text('Generated: ' + new Date().toLocaleDateString() + ' at ' + new Date().toLocaleTimeString(), 25, currentYPos + 15);
                doc.text('Total Comments: ' + comments.length, 25, currentYPos + 25);
                doc.text('Evaluated Slices: ' + this.getEvaluatedSlicesCount(), 25, currentYPos + 35);

                // Add average rating
                doc.text('Average Rating: ' + this.getAverageRatingDisplay(), 25, currentYPos + 45);

                currentYPos = 140; // Move past summary box

                // Track pages for footer
                let currentPage = 1;
                const totalPages = Math.ceil(Object.keys(evaluatedSlices).length / 2) + 1; // Estimate

                // Add footer to first page
                this.addPDFFooter(doc, currentPage, totalPages);

                // Add slice data
                const sortedSlices = Object.entries(evaluatedSlices)
                    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

                console.log('Processing slices:', sortedSlices.length);

                sortedSlices.forEach(([sliceNum, sliceData], index) => {
                    console.log(`Processing slice ${sliceNum} (${index + 1}/${sortedSlices.length})`);

                    const pageHeight = doc.internal.pageSize.getHeight();
                    const margin = 20;
                    const columnWidth = (pageWidth - (margin * 3)) / 2; // Two columns with margins

                    // Check if we need a new page (estimate space needed)
                    const estimatedHeight = 120; // Minimum space needed for slice
                    if (currentYPos + estimatedHeight > pageHeight - 50) { // Leave space for footer
                        // Add footer to current page before adding new page
                        this.addPDFFooter(doc, currentPage, totalPages);
                        doc.addPage();
                        this.addPDFHeader(doc);
                        currentPage++;
                        currentYPos = 70; // Start below header
                    }

                    // Slice header
                    doc.setFontSize(14);
                    doc.setFont(undefined, 'bold');
                    const sliceTitle = `Slice ${sliceData.sliceNumber + 1}${sliceData.hasRating ? ` - Rating: ${sliceData.rating}/10` : ''}`;
                    doc.text(sliceTitle, margin, currentYPos);
                    currentYPos += 15;

                    // Draw separator line
                    doc.setLineWidth(0.5);
                    doc.line(margin, currentYPos, pageWidth - margin, currentYPos);
                    currentYPos += 10;

                    // Left column: Image
                    const snapshot = sliceData.sliceImage;
                    let imageHeight = 0;
                    if (snapshot) {
                        try {
                            console.log('Adding image to PDF...');

                            // Get actual image dimensions from storage
                            const sliceImages = JSON.parse(localStorage.getItem('hema-slice-images') || '{}');
                            const storedImageData = sliceImages[sliceNum];

                            let actualAspectRatio = 0.75; // Default fallback to 4:3
                            if (storedImageData && storedImageData.dimensions) {
                                actualAspectRatio = storedImageData.dimensions.height / storedImageData.dimensions.width;
                                console.log(`Using actual aspect ratio: ${actualAspectRatio} (${storedImageData.dimensions.width}x${storedImageData.dimensions.height})`);
                            } else {
                                console.log('Using fallback aspect ratio: 4:3');
                            }

                            const imageWidth = columnWidth; // Full column width
                            imageHeight = imageWidth * actualAspectRatio; // Use actual aspect ratio
                            const imageX = margin; // Start at left margin of column

                            doc.addImage(snapshot, 'PNG', imageX, currentYPos, imageWidth, imageHeight);
                        } catch (error) {
                            console.error('Could not add image to PDF:', error);
                        }
                    }

                    // Right column: Comments
                    const commentsX = margin + columnWidth + margin; // Start of right column
                    let commentsY = currentYPos;

                    if (sliceData.hasComments) {
                        doc.setFontSize(12);
                        doc.setFont(undefined, 'bold');
                        doc.text('Comments:', commentsX, commentsY);
                        commentsY += 12;

                        doc.setFont(undefined, 'normal');
                        doc.setFontSize(10);

                        sliceData.comments.forEach((comment, commentIndex) => {
                            // Add bullet point
                            doc.text('•', commentsX, commentsY);

                            // Add comment text (no timestamp)
                            const commentText = comment.text.replace(/[\r\n]+/g, ' ');
                            const commentLines = doc.splitTextToSize(commentText, columnWidth - 10);
                            doc.text(commentLines, commentsX + 8, commentsY);
                            commentsY += (commentLines.length * 5) + 8; // Line height + spacing
                        });
                    } else if (sliceData.hasRating) {
                        doc.setFontSize(10);
                        doc.setFont(undefined, 'italic');
                        doc.text(`Rated ${sliceData.rating}/10 - No additional comments.`, commentsX, commentsY);
                    } else {
                        doc.setFontSize(10);
                        doc.setFont(undefined, 'italic');
                        doc.text('No comments', commentsX, commentsY);
                    }

                    // Move to next slice position (use the larger of image or comments height)
                    const contentHeight = Math.max(imageHeight, commentsY - currentYPos);
                    currentYPos += contentHeight + 20; // Add spacing between slices
                });

                // Add footer to final page
                this.addPDFFooter(doc, currentPage, totalPages);

                // Save the PDF
                const fileName = 'hema-medical-report-' + new Date().toISOString().split('T')[0] + '.pdf';
                console.log('Saving PDF as:', fileName);
                doc.save(fileName);

                console.log('PDF report generated successfully!');

            } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Error generating PDF: ' + error.message);
            }
        },

        // Rating system methods
        loadRatings: function() {
            const saved = localStorage.getItem('hema-slice-ratings');
            this.sliceRatings = saved ? JSON.parse(saved) : {};
        },

        saveRatings: function() {
            localStorage.setItem('hema-slice-ratings', JSON.stringify(this.sliceRatings));
        },

        loadSliceAnnotations: function() {
            const saved = localStorage.getItem('hema-slice-vector-annotations');
            this.sliceAnnotations = saved ? JSON.parse(saved) : {};
        },

        saveSliceAnnotations: function() {
            localStorage.setItem('hema-slice-vector-annotations', JSON.stringify(this.sliceAnnotations));
        },

        saveCurrentDrawingAsVector: function() {
            if (this.currentDrawingCoords && this.currentSlice >= 0) {
                // Initialize slice annotations if not exists
                if (!this.sliceAnnotations[this.currentSlice]) {
                    this.sliceAnnotations[this.currentSlice] = [];
                }

                // Save the drawing as vector data
                const drawingData = {
                    coords: this.currentDrawingCoords,
                    color: this.drawingColor,
                    lineWidth: this.brushSize,
                    mode: this.annotationMode,
                    timestamp: Date.now()
                };

                this.sliceAnnotations[this.currentSlice].push(drawingData);
                this.saveSliceAnnotations();

                // Clear the current drawing coordinates
                this.currentDrawingCoords = null;
            }
        },

        loadCurrentSliceAnnotation: function() {
            if (this.annotationCanvas && this.annotationCtx) {
                // Clear the annotation canvas
                this.annotationCtx.clearRect(0, 0, this.annotationCanvas.width, this.annotationCanvas.height);

                // Load and redraw all annotations for current slice
                const annotations = this.sliceAnnotations[this.currentSlice];
                if (annotations && annotations.length > 0) {
                    this.redrawAnnotations(annotations);
                }
            }
        },

        redrawAnnotations: function(annotations) {
            annotations.forEach(annotation => {
                if (!annotation.coords || annotation.coords.length === 0) return;

                // Set drawing properties
                this.annotationCtx.strokeStyle = annotation.color;
                this.annotationCtx.lineWidth = annotation.lineWidth;
                this.annotationCtx.lineCap = 'round';
                this.annotationCtx.lineJoin = 'round';

                // Set composite operation
                if (annotation.mode === 'erase') {
                    this.annotationCtx.globalCompositeOperation = 'destination-out';
                } else {
                    this.annotationCtx.globalCompositeOperation = 'source-over';
                }

                // Start path
                this.annotationCtx.beginPath();

                // Convert first point and move to it
                const firstCanvasCoords = this.imageToCanvasCoords(annotation.coords[0].x, annotation.coords[0].y);
                this.annotationCtx.moveTo(firstCanvasCoords.x, firstCanvasCoords.y);

                // Draw lines to subsequent points
                for (let i = 1; i < annotation.coords.length; i++) {
                    const canvasCoords = this.imageToCanvasCoords(annotation.coords[i].x, annotation.coords[i].y);
                    this.annotationCtx.lineTo(canvasCoords.x, canvasCoords.y);
                }

                // Stroke the path
                this.annotationCtx.stroke();
            });

            // Reset to normal composite operation
            this.annotationCtx.globalCompositeOperation = 'source-over';
        },

        setupStarRating: function() {
            const self = this;
            const starRatingPanel = Utils.getElementById(CONFIG.ELEMENTS.STAR_RATING_PANEL);
            const starRating = Utils.getElementById(CONFIG.ELEMENTS.STAR_RATING);

            if (starRatingPanel && starRating) {
                starRatingPanel.style.display = 'block';

                // Add hover effect to the panel
                starRatingPanel.addEventListener('mouseenter', function() {
                    this.style.opacity = '1';
                });

                starRatingPanel.addEventListener('mouseleave', function() {
                    this.style.opacity = '0.7';
                });

                // Add click handlers to stars
                const stars = starRating.querySelectorAll('.star');
                stars.forEach(star => {
                    star.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const rating = parseInt(this.getAttribute('data-rating'));
                        self.setSliceRating(rating);
                    });

                    star.addEventListener('mouseenter', function() {
                        const rating = parseInt(this.getAttribute('data-rating'));
                        self.highlightStars(rating);
                    });
                });

                starRating.addEventListener('mouseleave', function() {
                    self.updateStarDisplay();
                });
            }
        },

        setSliceRating: function(rating) {
            if (this.imageData && this.currentSlice >= 0) {
                this.sliceRatings[this.currentSlice] = rating;

                // Capture slice image for report (just like we do for comments)
                this.captureAndSaveSliceImage(this.currentSlice);

                this.saveRatings();
                this.updateStarDisplay();
                console.log(`Set rating ${rating} for slice ${this.currentSlice + 1}`);
            }
        },

        captureAndSaveSliceImage: function(sliceNumber) {
            // Capture the current slice image with proper sizing for PDF
            const sliceImage = this.captureSliceImageForPDF();
            if (sliceImage) {
                // Get existing slice images from localStorage
                const sliceImages = JSON.parse(localStorage.getItem('hema-slice-images') || '{}');

                // Store this slice's image
                sliceImages[sliceNumber] = {
                    image: sliceImage,
                    timestamp: Date.now(),
                    dimensions: {
                        width: this.imageCanvas.width,
                        height: this.imageCanvas.height
                    }
                };

                // Save back to localStorage
                localStorage.setItem('hema-slice-images', JSON.stringify(sliceImages));
                console.log(`Captured and saved image for slice ${sliceNumber + 1}`);
            }
        },

        getSliceImage: function(sliceNumber) {
            // Get slice image from storage
            const sliceImages = JSON.parse(localStorage.getItem('hema-slice-images') || '{}');
            return sliceImages[sliceNumber] ? sliceImages[sliceNumber].image : null;
        },

        getAllEvaluatedSliceData: function() {
            // Get slices that should be included in reports:
            // - Slices with comments (regardless of drawings/ratings)
            // - Slices with ratings (regardless of drawings/comments)
            // - Exclude slices with only drawings but no comments or ratings
            const comments = JSON.parse(localStorage.getItem('hema-comments') || '[]');
            const evaluatedSlices = {};

            // Group comments by slice
            const commentsBySlice = {};
            comments.forEach(comment => {
                if (!commentsBySlice[comment.slice]) {
                    commentsBySlice[comment.slice] = [];
                }
                commentsBySlice[comment.slice].push(comment);
            });

            // Create data for evaluated slices that meet inclusion criteria
            const allSliceNumbers = new Set();

            // Add slices with comments (these should always be included)
            Object.keys(commentsBySlice).forEach(slice => {
                allSliceNumbers.add(parseInt(slice));
            });

            // Add slices with ratings (these should always be included)
            Object.keys(this.sliceRatings).forEach(slice => {
                if (this.sliceRatings[slice] > 0) {
                    allSliceNumbers.add(parseInt(slice));
                }
            });

            // Build complete data for each evaluated slice
            // NOTE: Slices with only drawings (no comments or ratings) are automatically excluded
            allSliceNumbers.forEach(sliceNum => {
                const hasComments = commentsBySlice[sliceNum] && commentsBySlice[sliceNum].length > 0;
                const hasRating = this.sliceRatings[sliceNum] > 0;

                // Only include if slice has comments OR ratings (not just drawings)
                if (hasComments || hasRating) {
                    evaluatedSlices[sliceNum] = {
                        sliceNumber: sliceNum,
                        comments: commentsBySlice[sliceNum] || [],
                        rating: this.sliceRatings[sliceNum] || 0,
                        sliceImage: this.getSliceImage(sliceNum),
                        hasComments: hasComments,
                        hasRating: hasRating
                    };
                }
            });

            return evaluatedSlices;
        },

        highlightStars: function(rating) {
            const stars = document.querySelectorAll('#starRating .star');
            stars.forEach((star, index) => {
                const starRating = parseInt(star.getAttribute('data-rating'));
                if (starRating <= rating) {
                    star.style.color = '#fbbf24'; // Gold color
                } else {
                    star.style.color = '#64748b'; // Gray color
                }
            });
        },

        updateStarDisplay: function() {
            const currentRating = this.sliceRatings[this.currentSlice] || 0;
            const ratingDisplay = Utils.getElementById(CONFIG.ELEMENTS.RATING_DISPLAY);

            // Update star colors
            this.highlightStars(currentRating);

            // Update display text
            if (ratingDisplay) {
                ratingDisplay.textContent = `${currentRating}/10`;
            }
        },

        calculateAverageRating: function() {
            const ratings = Object.values(this.sliceRatings).filter(r => r > 0);
            if (ratings.length === 0) return 0;

            const sum = ratings.reduce((a, b) => a + b, 0);
            return (sum / ratings.length).toFixed(1);
        },

        getEvaluatedSlicesCount: function() {
            // Count slices that should be included in reports:
            // - Slices with comments (regardless of drawings/ratings)
            // - Slices with ratings (regardless of drawings/comments)
            // - Exclude slices with only drawings but no comments or ratings
            const commentsSlices = new Set();
            const ratingsSlices = new Set();

            // Get slices with comments
            const comments = JSON.parse(localStorage.getItem('hema-comments') || '[]');
            comments.forEach(comment => {
                if (comment.slice !== undefined && comment.slice !== null) {
                    commentsSlices.add(comment.slice);
                }
            });

            // Get slices with ratings
            Object.keys(this.sliceRatings).forEach(slice => {
                if (this.sliceRatings[slice] > 0) {
                    ratingsSlices.add(parseInt(slice));
                }
            });

            // Combine both sets (union) to get total evaluated slices
            // NOTE: This automatically excludes slices with only drawings (no comments or ratings)
            const evaluatedSlices = new Set([...commentsSlices, ...ratingsSlices]);
            return evaluatedSlices.size;
        },

        getAverageRatingDisplay: function() {
            const ratedSlices = Object.values(this.sliceRatings).filter(r => r > 0).length;

            if (ratedSlices === 0) {
                return 'No ratings provided';
            }

            const averageRating = this.calculateAverageRating();
            return `${averageRating}/10 (based on ${ratedSlices} rated slice${ratedSlices === 1 ? '' : 's'})`;
        },

        addPDFHeader: function(doc) {
            const pageWidth = doc.internal.pageSize.getWidth();

            // Header background
            doc.setFillColor(15, 23, 42); // Dark background
            doc.rect(0, 0, pageWidth, 50, 'F');

            // HEMA logo/icon area
            doc.setFillColor(79, 70, 229); // Purple gradient start
            doc.rect(20, 15, 20, 20, 'F');

            // HEMA text
            doc.setFontSize(24);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('HEMA', 50, 25);

            // Subtitle
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(148, 163, 184); // Light gray
            doc.text('Human Evaluation of Medical AI', 50, 35);

            // Medical report text on right
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(255, 255, 255);
            const reportText = 'MEDICAL EVALUATION REPORT';
            const textWidth = doc.getTextWidth(reportText);
            doc.text(reportText, pageWidth - textWidth - 20, 25);

            // Header line
            doc.setDrawColor(71, 85, 105);
            doc.setLineWidth(1);
            doc.line(20, 55, pageWidth - 20, 55);

            // Reset colors
            doc.setTextColor(0, 0, 0);
            doc.setDrawColor(0, 0, 0);
        },

        addPDFFooter: function(doc, pageNumber, totalPages) {
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Footer line
            doc.setDrawColor(71, 85, 105);
            doc.setLineWidth(0.5);
            doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);

            // Footer content
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(107, 114, 128);

            // Left side - HEMA info
            doc.text('HEMA Platform - Confidential Medical Report', 20, pageHeight - 15);

            // Right side - Page number
            const pageText = `Page ${pageNumber} of ${totalPages}`;
            const pageTextWidth = doc.getTextWidth(pageText);
            doc.text(pageText, pageWidth - pageTextWidth - 20, pageHeight - 15);

            // Center - Generation date
            const dateText = `Generated on ${new Date().toLocaleDateString()}`;
            const dateTextWidth = doc.getTextWidth(dateText);
            doc.text(dateText, (pageWidth - dateTextWidth) / 2, pageHeight - 15);

            // Reset colors
            doc.setTextColor(0, 0, 0);
            doc.setDrawColor(0, 0, 0);
        },

        clear: function() {
            this.imageData = null;
            this.labelData = null;
            this.currentSlice = 0;
            this.labelCategories = [];

            if (this.imageCtx && this.labelCtx) {
                this.imageCtx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
                this.labelCtx.clearRect(0, 0, this.labelCanvas.width, this.labelCanvas.height);
            }
        }
    };

    // ============================================================================
    // MAIN APPLICATION
    // ============================================================================

    /**
     * Main HEMA Application
     */
    function HEMAApp() {
        this.navigation = null;
        this.fileHandler = null;
        this.segmentationViewer = null;
        this.errorHandler = null;
        this.isInitialized = false;
    }

    HEMAApp.prototype = {
        init: function() {
            const self = this;

            try {
                console.log('Initializing HEMA Application');

                // Check for required dependencies
                this.checkDependencies();

                // Initialize components
                this.initializeComponents();

                // Setup component interactions
                this.setupComponentCallbacks();

                // Setup global event listeners
                this.setupGlobalEvents();

                this.isInitialized = true;
                console.log('HEMA Application initialized successfully');

            } catch (error) {
                console.error('Failed to initialize HEMA Application:', error);
                if (this.errorHandler) {
                    this.errorHandler.showError('Failed to initialize application: ' + error.message);
                } else {
                    alert('Failed to initialize application: ' + error.message);
                }
            }
        },

        checkDependencies: function() {
            const requiredGlobals = ['pako'];
            const missing = [];

            requiredGlobals.forEach(function(dep) {
                if (typeof window[dep] === 'undefined') {
                    missing.push(dep);
                }
            });

            if (missing.length > 0) {
                throw new Error('Missing required dependencies: ' + missing.join(', '));
            }
        },

        initializeComponents: function() {
            // Initialize error handler first
            this.errorHandler = new ErrorHandler();

            // Initialize navigation
            this.navigation = new Navigation();

            // Initialize file handler
            this.fileHandler = new FileHandler();
            this.fileHandler.init();

            // Initialize viewers
            this.segmentationViewer = new SegmentationViewer();

            console.log('All components initialized');
        },

        setupComponentCallbacks: function() {
            const self = this;

            // File handler callbacks
            this.fileHandler.setCallbacks({
                onImageLoaded: function(data) { self.handleImageLoaded(data); },
                onLabelLoaded: function(data) { self.handleLabelLoaded(data); },
                onError: function(message) { self.errorHandler.showError(message); }
            });
        },

        setupGlobalEvents: function() {
            const self = this;

            // Handle window resize
            window.addEventListener('resize', Utils.debounce(function() {
                self.handleWindowResize();
            }, 250));

            // Handle visibility changes
            document.addEventListener('visibilitychange', function() {
                self.handleVisibilityChange();
            });

            // Handle errors
            window.addEventListener('error', function(event) {
                console.error('Global error:', event.error);
                if (self.errorHandler) {
                    self.errorHandler.showError('An unexpected error occurred', event.error);
                }
            });

            // Handle unhandled promise rejections
            window.addEventListener('unhandledrejection', function(event) {
                console.error('Unhandled promise rejection:', event.reason);
                if (self.errorHandler) {
                    self.errorHandler.showError('An unexpected error occurred');
                }
                event.preventDefault();
            });
        },

        handleImageLoaded: function(imageData) {
            console.log('Image loaded, checking for label data');
            console.log('Has both files?', this.fileHandler.hasBothFiles());

            if (this.fileHandler.hasBothFiles()) {
                console.log('Both files loaded - setting up viewer');
                this.setupSegmentationViewer();
            } else {
                console.log('Waiting for label file...');
            }
        },

        handleLabelLoaded: function(labelData) {
            console.log('Label loaded, checking for image data');
            console.log('Has both files?', this.fileHandler.hasBothFiles());

            if (this.fileHandler.hasBothFiles()) {
                console.log('Both files loaded - setting up viewer');
                this.setupSegmentationViewer();
            } else {
                console.log('Waiting for image file...');
            }
        },

        setupSegmentationViewer: function() {
            try {
                const imageData = this.fileHandler.getImageData();
                const labelData = this.fileHandler.getLabelData();

                if (!imageData || !labelData) {
                    throw new Error('Missing image or label data');
                }

                // Validate dimensions match
                console.log('Validating dimensions...');
                if (!this.fileHandler.validateDimensions()) {
                    console.error('Dimension validation failed!');
                    this.errorHandler.showDimensionError();
                    return;
                }
                console.log('Dimensions validated successfully');

                // Load data into viewer
                this.segmentationViewer.loadData(imageData, labelData);

                // Show viewer
                this.navigation.showViewer();

                console.log('Segmentation viewer setup completed');

            } catch (error) {
                console.error('Failed to setup segmentation viewer:', error);
                this.errorHandler.showError('Failed to display segmentation: ' + error.message);
            }
        },

        handleWindowResize: function() {
            console.log('Window resized');
        },

        handleVisibilityChange: function() {
            console.log('Visibility changed');
        },

        getStatus: function() {
            return {
                initialized: this.isInitialized,
                currentMode: this.navigation ? this.navigation.getCurrentMode() : null,
                hasFiles: {
                    image: !!this.fileHandler && !!this.fileHandler.getImageData(),
                    label: !!this.fileHandler && !!this.fileHandler.getLabelData()
                }
            };
        },

        reset: function() {
            try {
                console.log('Resetting application');

                // Clear file handler
                if (this.fileHandler) {
                    this.fileHandler.clearFiles();
                }

                // Clear viewers
                if (this.segmentationViewer) {
                    this.segmentationViewer.clear();
                }

                // Clear errors
                if (this.errorHandler) {
                    this.errorHandler.clearErrors();
                }

                // Return to landing page
                if (this.navigation) {
                    this.navigation.showLanding();
                }

                console.log('Application reset completed');

            } catch (error) {
                console.error('Failed to reset application:', error);
            }
        }
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    // Create global app instance
    const app = new HEMAApp();

    // Initialize when DOM is ready
    function initializeApp() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                app.init();
            });
        } else {
            app.init();
        }
    }

    // Export to global scope
    window.HEMAApp = app;
    window.HEMA = {
        app: app,
        CONFIG: CONFIG,
        Utils: Utils
    };

    // Start the application
    initializeApp();

})(window, document);
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
            IMAGE_FILE: 'imageFile',
            LABEL_FILE: 'labelFile',
            SLICE_SLIDER: 'sliceSlider',
            OPACITY_SLIDER: 'opacitySlider',
            SLICE_INFO: 'sliceInfo',
            OPACITY_VALUE: 'opacityValue',
            ZOOM_IN: 'zoomIn',
            ZOOM_OUT: 'zoomOut',
            RESET_VIEW: 'resetView',
            ZOOM_VALUE: 'zoomValue'
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
            console.error('Error:', message, error);

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

            return imageData.sizes.join(',') === labelData.sizes.join(',');
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
        this.imageCtx = null;
        this.labelCtx = null;

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
        this.imageWidth = 0;
        this.imageHeight = 0;

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

            if (this.imageCanvas && this.labelCanvas) {
                this.imageCtx = this.imageCanvas.getContext('2d');
                this.labelCtx = this.labelCanvas.getContext('2d');

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

            const zoomInBtn = Utils.getElementById(CONFIG.ELEMENTS.ZOOM_IN);
            const zoomOutBtn = Utils.getElementById(CONFIG.ELEMENTS.ZOOM_OUT);
            const resetViewBtn = Utils.getElementById(CONFIG.ELEMENTS.RESET_VIEW);

            console.log('Zoom buttons found:', {
                zoomIn: !!zoomInBtn,
                zoomOut: !!zoomOutBtn,
                resetView: !!resetViewBtn
            });

            if (zoomInBtn) {
                zoomInBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Zoom in clicked');
                    self.zoomIn();
                });
            }

            if (zoomOutBtn) {
                zoomOutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Zoom out clicked');
                    self.zoomOut();
                });
            }

            if (resetViewBtn) {
                resetViewBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Reset view clicked');
                    self.resetView();
                });
            }
        },

        setupCanvasEvents: function() {
            const self = this;
            const container = Utils.getElementById(CONFIG.ELEMENTS.CANVAS_CONTAINER);

            if (!container) return;

            // Mouse events for panning
            container.addEventListener('mousedown', function(e) {
                self.isDragging = true;
                self.lastMouseX = e.clientX;
                self.lastMouseY = e.clientY;
                container.style.cursor = 'grabbing';
                e.preventDefault();
            });

            container.addEventListener('mousemove', function(e) {
                if (!self.isDragging) return;

                const deltaX = e.clientX - self.lastMouseX;
                const deltaY = e.clientY - self.lastMouseY;

                self.panX += deltaX / self.zoom;
                self.panY += deltaY / self.zoom;

                self.lastMouseX = e.clientX;
                self.lastMouseY = e.clientY;

                self.renderSlice();
                e.preventDefault();
            });

            container.addEventListener('mouseup', function(e) {
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

                    self.panX += deltaX / self.zoom;
                    self.panY += deltaY / self.zoom;

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
                    self.errorHandler.showError('An unexpected error occurred');
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

            if (this.fileHandler.hasBothFiles()) {
                this.setupSegmentationViewer();
            }
        },

        handleLabelLoaded: function(labelData) {
            console.log('Label loaded, checking for image data');

            if (this.fileHandler.hasBothFiles()) {
                this.setupSegmentationViewer();
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
                if (!this.fileHandler.validateDimensions()) {
                    this.errorHandler.showDimensionError();
                    return;
                }

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
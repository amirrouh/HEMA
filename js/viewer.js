/**
 * NRRD Overlay Viewer
 */
class NRRDViewer {
  constructor() {
    this.imageData = null;
    this.labelData = null;
    this.stlData = null;
    this.currentSlice = 0;
    this.labelOpacity = 0.5;
    this.labelCategories = [];
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    this.categoryColors = [
      [255, 0, 0], // Red
      [0, 255, 0], // Green
      [0, 0, 255], // Blue
      [255, 255, 0], // Yellow
      [255, 0, 255], // Magenta
      [0, 255, 255], // Cyan
      [255, 128, 0], // Orange
      [128, 0, 255], // Purple
    ];

    this.imageCanvas = document.getElementById("imageCanvas");
    this.labelCanvas = document.getElementById("labelCanvas");
    this.stlCanvas = document.getElementById("stlCanvas");
    
    console.log("Canvas elements check:", {
      imageCanvas: !!this.imageCanvas,
      labelCanvas: !!this.labelCanvas,
      stlCanvas: !!this.stlCanvas
    });
    
    if (this.imageCanvas && this.labelCanvas) {
      this.imageCtx = this.imageCanvas.getContext("2d");
      this.labelCtx = this.labelCanvas.getContext("2d");
    } else {
      console.error("Missing canvas elements!");
    }

    this.initEventListeners();
  }

  initEventListeners() {
    document.getElementById("imageFile").addEventListener("change", (e) => {
      this.loadFile(e, "image");
    });

    document.getElementById("labelFile").addEventListener("change", (e) => {
      this.loadFile(e, "label");
    });

    document.getElementById("stlFile").addEventListener("change", (e) => {
      this.loadSTLFile(e);
    });

    document.getElementById("sliceSlider").addEventListener("input", (e) => {
      this.currentSlice = parseInt(e.target.value);
      this.renderSlice();
    });

    document.getElementById("opacitySlider").addEventListener("input", (e) => {
      this.labelOpacity = e.target.value / 100;
      document.getElementById("opacityValue").textContent =
        e.target.value + "%";
      this.renderSlice();
    });
  }

  loadFile(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    console.log(`Loading ${type} file:`, file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let data;
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".nii") || fileName.endsWith(".nii.gz")) {
          data = NIFTIParser.parse(e.target.result);
        } else if (fileName.endsWith(".nrrd")) {
          data = NRRDParser.parse(e.target.result);
        } else {
          throw new Error(
            "Unsupported file format. Please use .nrrd, .nii, or .nii.gz files.",
          );
        }

        console.log(`${type} file parsed successfully:`, data.sizes);

        if (type === "image") {
          this.imageData = data;
        } else {
          this.labelData = data;
        }

        if (type === "label") {
          this.detectCategories();
        }

        console.log(`Current state - imageData:`, !!this.imageData, `labelData:`, !!this.labelData);

        if (this.imageData && this.labelData) {
          console.log("Both files loaded, setting up viewer...");
          this.setupViewer();
        }
      } catch (error) {
        console.error(`Error loading ${type}:`, error);
        this.showError(`Error loading ${type}: ${error.message}`);
      }
    };

    reader.onerror = () => {
      console.error(`Failed to read ${type} file`);
      this.showError(`Failed to read ${type} file`);
    };

    reader.readAsArrayBuffer(file);
  }

  loadSTLFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        console.log("Parsing STL file:", file.name);
        this.stlData = STLParser.parse(e.target.result);
        console.log("STL data parsed:", this.stlData);
        this.setupSTLViewer();
      } catch (error) {
        console.error("STL parsing error:", error);
        this.showError(`Error loading STL: ${error.message}`);
      }
    };

    reader.onerror = () => {
      this.showError("Failed to read STL file");
    };

    reader.readAsArrayBuffer(file);
  }

  detectCategories() {
    const uniqueValues = new Set();
    const data = this.labelData.data;
    const chunkSize = 100000;

    for (let i = 0; i < data.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, data.length);
      for (let j = i; j < end; j++) {
        uniqueValues.add(data[j]);
      }
    }

    this.labelCategories = Array.from(uniqueValues).sort((a, b) => a - b);
    console.log("Label categories detected:", this.labelCategories);
  }

  setupViewer() {
    console.log("setupViewer called");
    const [width, height, depth] = this.imageData.sizes;

    // Check dimensions match
    if (this.imageData.sizes.join(",") !== this.labelData.sizes.join(",")) {
      this.showError("Image and label dimensions do not match");
      return;
    }

    console.log("Dimensions match, showing viewer elements...");

    // Show viewer container and separator
    const viewerContainer = document.getElementById("viewer-container");
    const viewerSeparator = document.getElementById("viewer-separator");
    
    console.log("viewer-container element:", viewerContainer);
    console.log("viewer-separator element:", viewerSeparator);
    
    if (!viewerContainer) {
      console.error("viewer-container element not found!");
      return;
    }
    
    if (!viewerSeparator) {
      console.error("viewer-separator element not found!");
      return;
    }

    viewerContainer.style.display = "block";
    viewerSeparator.style.display = "block";

    console.log("Viewer elements shown, initiating scroll...");

    // Smooth scroll to viewer after a brief delay
    setTimeout(() => {
      const viewerContainer = document.getElementById("viewer-container");
      if (viewerContainer) {
        // Wait a bit more for the container to be fully rendered
        setTimeout(() => {
          const rect = viewerContainer.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const elementCenter = rect.top + window.scrollY + (rect.height / 2);
          const scrollToPosition = elementCenter - (viewportHeight / 2);
          
          window.scrollTo({
            top: Math.max(0, scrollToPosition),
            behavior: 'smooth'
          });
          console.log("Scroll initiated to center viewer section");
        }, 100);
      }
    }, 150);

    // Set canvas dimensions
    this.imageCanvas.width = width;
    this.imageCanvas.height = height;
    this.labelCanvas.width = width;
    this.labelCanvas.height = height;

    // Set container dimensions
    const container = document.getElementById("canvas-container");
    console.log("canvas-container element:", container);
    
    if (container) {
      container.style.width = width + "px";
      container.style.height = height + "px";
    } else {
      console.error("canvas-container element not found!");
    }

    // Setup slider
    const sliceSlider = document.getElementById("sliceSlider");
    console.log("sliceSlider element:", sliceSlider);
    
    if (sliceSlider) {
      sliceSlider.max = depth - 1;
      sliceSlider.value = Math.floor(depth / 2);
      this.currentSlice = Math.floor(depth / 2);
    } else {
      console.error("sliceSlider element not found!");
    }

    // Show elements and update styling
    const canvasContainer = document.getElementById("canvas-container");
    const controls = document.getElementById("controls");
    const error = document.getElementById("error");
    const viewer = document.getElementById("viewer");
    
    console.log("Elements check:", {
      canvasContainer: !!canvasContainer,
      controls: !!controls,
      error: !!error,
      viewer: !!viewer
    });
    
    if (canvasContainer) canvasContainer.style.display = "block";
    if (controls) controls.style.display = "block";
    if (error) error.style.display = "none";
    if (viewer) viewer.classList.add("has-files");

    // Update category count if element exists
    const categoryCountElement = document.getElementById("categoryCount");
    if (categoryCountElement) {
      categoryCountElement.textContent = this.labelCategories.length;
    }

    this.renderSlice();
  }

  renderSlice() {
    if (!this.imageData || !this.labelData) return;

    const [width, height] = this.imageData.sizes;
    const sliceSize = width * height;
    const offset = this.currentSlice * sliceSize;

    // Clear canvases
    this.imageCtx.clearRect(0, 0, width, height);
    this.labelCtx.clearRect(0, 0, width, height);

    // Normalize image values for better visibility
    let minVal = this.imageData.data[offset];
    let maxVal = this.imageData.data[offset];

    for (let i = 0; i < sliceSize; i++) {
      const value = this.imageData.data[offset + i];
      if (value < minVal) minVal = value;
      if (value > maxVal) maxVal = value;
    }

    const range = maxVal - minVal;

    // Render image - normalized values
    const imageBuffer = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < sliceSize; i++) {
      const rawValue = this.imageData.data[offset + i];
      const normalizedValue =
        range > 0 ? Math.floor(((rawValue - minVal) / range) * 255) : 0;
      const idx = i * 4;
      imageBuffer[idx] = normalizedValue; // R
      imageBuffer[idx + 1] = normalizedValue; // G
      imageBuffer[idx + 2] = normalizedValue; // B
      imageBuffer[idx + 3] = 255; // A
    }

    // Render labels - multi-category with color mapping
    const labelBuffer = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < sliceSize; i++) {
      const value = this.labelData.data[offset + i];
      const idx = i * 4;

      if (value > 0) {
        // Find category index (skip background which is 0)
        const categoryIndex = this.labelCategories.indexOf(value);
        const colorIndex = Math.max(0, categoryIndex - 1); // Skip first category if it's 0
        const color =
          this.categoryColors[colorIndex % this.categoryColors.length];

        labelBuffer[idx] = color[0]; // R
        labelBuffer[idx + 1] = color[1]; // G
        labelBuffer[idx + 2] = color[2]; // B
        labelBuffer[idx + 3] = Math.floor(this.labelOpacity * 255); // A
      } else {
        // Transparent for background
        labelBuffer[idx] = 0; // R
        labelBuffer[idx + 1] = 0; // G
        labelBuffer[idx + 2] = 0; // B
        labelBuffer[idx + 3] = 0; // A (fully transparent)
      }
    }

    // Draw to canvases
    this.imageCtx.putImageData(new ImageData(imageBuffer, width, height), 0, 0);
    this.labelCtx.putImageData(new ImageData(labelBuffer, width, height), 0, 0);

    // Update slice info
    document.getElementById("sliceInfo").textContent =
      `${this.currentSlice + 1}/${this.imageData.sizes[2]}`;
  }

  setupSTLViewer() {
    if (!this.stlData) return;

    // Show viewer container and separator
    document.getElementById("viewer-container").style.display = "block";
    document.getElementById("viewer-separator").style.display = "block";

    // Smooth scroll to viewer after a brief delay
    setTimeout(() => {
      const viewerContainer = document.getElementById("viewer-container");
      if (viewerContainer) {
        // Wait a bit more for the container to be fully rendered
        setTimeout(() => {
          const rect = viewerContainer.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const elementCenter = rect.top + window.scrollY + (rect.height / 2);
          const scrollToPosition = elementCenter - (viewportHeight / 2);
          
          window.scrollTo({
            top: Math.max(0, scrollToPosition),
            behavior: 'smooth'
          });
        }, 100);
      }
    }, 150);

    // Hide other containers and show STL container
    document.getElementById("canvas-container").style.display = "none";
    document.getElementById("controls").style.display = "none";
    document.getElementById("stl-container").style.display = "block";
    document.getElementById("error").style.display = "none";

    // Initialize Three.js scene
    this.initThreeJS();

    // Create mesh from STL data
    this.createSTLMesh();

    // Start rendering
    this.animate();
  }

  initThreeJS() {
    const container = document.getElementById("stl-container");

    // Ensure container is visible and has dimensions
    container.style.width = "100%";
    container.style.height = "600px";

    // Force a reflow to ensure dimensions are calculated
    container.offsetHeight;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    console.log("=== Three.js Initialization Debug ===");
    console.log("Container dimensions:", width, "x", height);
    console.log("Container style:", container.style.cssText);
    console.log(
      "Container computed style:",
      window.getComputedStyle(container).display,
    );

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    console.log(
      "Scene created with background:",
      this.scene.background.getHex(),
    );

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000);
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);
    console.log("Camera position:", this.camera.position.toArray());
    console.log("Camera target:", [0, 0, 0]);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.stlCanvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0xffffff, 1.0);
    this.renderer.shadowMap.enabled = false; // Disable shadows for now
    console.log("Renderer created, size set to:", width, "x", height);

    // Enhanced lighting for depth perception (no shadows to avoid compatibility issues)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);
    console.log("Ambient light added:", ambientLight.intensity);

    // Key light (main)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(10, 10, 5);
    keyLight.castShadow = false; // Disable shadows to avoid compatibility issues
    this.scene.add(keyLight);
    console.log("Key light added at:", keyLight.position.toArray());

    // Fill light (softer, opposite side)
    const fillLight = new THREE.DirectionalLight(0x6699ff, 0.3);
    fillLight.position.set(-10, 5, -5);
    fillLight.castShadow = false;
    this.scene.add(fillLight);
    console.log("Fill light added at:", fillLight.position.toArray());

    // Back light (rim lighting for depth)
    const backLight = new THREE.DirectionalLight(0xffaa44, 0.2);
    backLight.position.set(0, -10, -10);
    backLight.castShadow = false;
    this.scene.add(backLight);
    console.log("Back light added at:", backLight.position.toArray());

    // Disable shadows to avoid Three.js compatibility issues
    this.renderer.shadowMap.enabled = false;

    // Controls for mouse interaction
    this.setupControls();

    console.log("Three.js initialized successfully");
  }

  createSTLMesh() {
    if (!this.stlData) {
      console.error("No STL data available");
      this.showError("No STL data available for rendering");
      return;
    }

    if (!this.stlData.vertices || this.stlData.vertices.length === 0) {
      console.error("STL data has no vertices");
      this.showError("STL file appears to be empty or corrupted");
      return;
    }

    console.log(
      "Creating mesh with vertices:",
      this.stlData.vertices.length / 3,
      "triangles:",
      this.stlData.triangleCount,
    );

    // Create geometry from STL data
    const geometry = new THREE.BufferGeometry();

    console.log("=== STL Mesh Creation Debug ===");
    console.log("Vertices array length:", this.stlData.vertices.length);
    console.log(
      "Normals array length:",
      this.stlData.normals ? this.stlData.normals.length : "none",
    );
    console.log(
      "Indices array length:",
      this.stlData.indices ? this.stlData.indices.length : "none",
    );
    console.log("First few vertices:", this.stlData.vertices.slice(0, 12));
    console.log("Triangle count:", this.stlData.triangleCount);

    // Validate vertices data thoroughly
    if (!this.stlData.vertices) {
      console.error("No vertices property in STL data");
      this.showError("STL parsing failed - no vertices found");
      return;
    }

    if (!(this.stlData.vertices instanceof Float32Array)) {
      console.error(
        "Vertices is not Float32Array:",
        typeof this.stlData.vertices,
      );
      this.showError("Invalid vertex data type in STL file");
      return;
    }

    if (this.stlData.vertices.length === 0) {
      console.error("Empty vertices array");
      this.showError("STL file contains no vertex data");
      return;
    }

    if (this.stlData.vertices.length % 3 !== 0) {
      console.error(
        "Vertices array length not divisible by 3:",
        this.stlData.vertices.length,
      );
      this.showError("Invalid STL vertex data format");
      return;
    }

    // Check for valid numeric data
    for (let i = 0; i < Math.min(9, this.stlData.vertices.length); i++) {
      if (!isFinite(this.stlData.vertices[i])) {
        console.error(
          "Invalid vertex data at index",
          i,
          ":",
          this.stlData.vertices[i],
        );
        this.showError("STL file contains invalid numeric data");
        return;
      }
    }

    // Simple geometry creation without indices (exactly like minimal viewer)
    try {
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(this.stlData.vertices, 3),
      );
      console.log(
        "Position attribute set, vertex count:",
        this.stlData.vertices.length / 3,
      );
    } catch (error) {
      console.error("Failed to create position attribute:", error);
      this.showError("Failed to create geometry from STL data");
      return;
    }

    // DO NOT use indices - this causes the onUploadCallback error
    console.log(
      "Using non-indexed geometry to avoid Three.js compatibility issues",
    );

    // Always compute normals for consistent lighting
    try {
      geometry.computeVertexNormals();
      console.log("Vertex normals computed");
    } catch (error) {
      console.error("Failed to compute normals:", error);
      this.showError("Failed to compute normals for STL mesh");
      return;
    }

    // Compute other required attributes
    try {
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      if (!geometry.boundingBox) {
        console.error("Failed to compute bounding box");
        this.showError("Invalid STL geometry - cannot compute bounds");
        return;
      }

      console.log("Computed bounding box:", geometry.boundingBox);
      console.log("Computed bounding sphere:", geometry.boundingSphere);
    } catch (error) {
      console.error("Failed to compute geometry bounds:", error);
      this.showError("Failed to process STL geometry");
      return;
    }

    // Use Phong material for proper 3D shading and depth perception
    const material = new THREE.MeshPhongMaterial({
      color: 0x888888, // Neutral gray for evaluation
      shininess: 30, // Some shininess for depth
      side: THREE.DoubleSide,
      wireframe: false, // Start with solid for depth perception
    });

    // Add depth fog for better 3D perception (white fog to match background)
    this.scene.fog = new THREE.Fog(0xffffff, 10, 100);

    console.log("Material created - Phong with depth shading");

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    console.log("Mesh created");

    // Center and scale the mesh properly using geometry translation
    this.centerAndScaleMesh();

    this.scene.add(this.mesh);
    console.log("Mesh added to scene");

    // Debug mesh state
    console.log("Final mesh position:", this.mesh.position.toArray());
    console.log("Final mesh scale:", this.mesh.scale.toArray());
    console.log("Final mesh visible:", this.mesh.visible);
    console.log("Scene children count:", this.scene.children.length);

    console.log("Mesh created and added to scene");
  }

  centerAndScaleMesh() {
    if (!this.mesh) {
      console.error("No mesh to center");
      return;
    }

    // Calculate bounding box from geometry (more reliable)
    this.mesh.geometry.computeBoundingBox();
    const box = this.mesh.geometry.boundingBox;

    if (!box) {
      console.error("Could not compute bounding box");
      return;
    }

    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    console.log("=== Mesh Centering Debug ===");
    console.log("Bounding box min:", box.min.toArray());
    console.log("Bounding box max:", box.max.toArray());
    console.log("Center:", center.toArray());
    console.log("Size:", size.toArray());

    // PROPER centering: translate geometry, not mesh position
    this.mesh.geometry.translate(-center.x, -center.y, -center.z);
    console.log("Geometry translated by:", [-center.x, -center.y, -center.z]);

    // Keep mesh at origin
    this.mesh.position.set(0, 0, 0);

    // Scale to fit in view (make it reasonable size)
    const maxDim = Math.max(size.x, size.y, size.z);
    console.log("Max dimension:", maxDim);

    if (maxDim > 0) {
      const targetSize = 15; // Target size in world units
      const scale = targetSize / maxDim;
      this.mesh.scale.setScalar(scale);
      console.log("Applied scale factor:", scale);
      console.log("Final mesh scale:", this.mesh.scale.toArray());
    }

    // Position camera to see centered mesh
    this.camera.position.set(25, 25, 25);
    this.camera.lookAt(0, 0, 0);

    console.log("Final camera position:", this.camera.position.toArray());
    console.log("Camera looking at origin: [0, 0, 0]");
  }

  setupControls() {
    // Simple mouse controls for rotation
    let isMouseDown = false;
    let mouseX = 0,
      mouseY = 0;

    this.stlCanvas.addEventListener("mousedown", (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    this.stlCanvas.addEventListener("mousemove", (event) => {
      if (!isMouseDown || !this.mesh) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      this.mesh.rotation.y += deltaX * 0.01;
      this.mesh.rotation.x += deltaY * 0.01;

      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    this.stlCanvas.addEventListener("mouseup", () => {
      isMouseDown = false;
    });

    // Mouse wheel for zoom
    this.stlCanvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const scale = event.deltaY > 0 ? 1.1 : 0.9;
      this.camera.position.multiplyScalar(scale);
    });

    // Enhanced keyboard controls for STL viewing
    document.addEventListener("keydown", (event) => {
      if (!this.mesh || !this.mesh.material) return;

      switch (event.key.toLowerCase()) {
        case "w":
          this.mesh.material.wireframe = !this.mesh.material.wireframe;
          console.log("Wireframe toggled:", this.mesh.material.wireframe);
          break;
        case "f":
          // Toggle fog for depth (white fog to match background)
          this.scene.fog = this.scene.fog
            ? null
            : new THREE.Fog(0xffffff, 10, 100);
          console.log("Fog toggled:", !!this.scene.fog);
          break;
        case "r":
          // Reset camera position
          this.camera.position.set(25, 25, 25);
          this.camera.lookAt(0, 0, 0);
          console.log("Camera reset to default position");
          break;
      }
    });

    // Handle canvas resize
    window.addEventListener("resize", () => {
      if (!this.renderer || !this.camera) return;

      const container = document.getElementById("stl-container");
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 600;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  animate() {
    if (!this.renderer || !this.scene || !this.camera) {
      console.error("Missing components for animation");
      return;
    }

    requestAnimationFrame(() => this.animate());

    // No automatic rotation - let user control it manually

    // Simple render without try-catch (like minimal viewer)
    this.renderer.render(this.scene, this.camera);
  }

  showError(message) {
    const errorElement = document.getElementById("error");
    errorElement.textContent = message;
    errorElement.style.display = "block";
  }
}

// Export to window for use in HTML
window.NRRDViewer = NRRDViewer;

// Initialize viewer when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.nrrdViewer = new NRRDViewer();
});

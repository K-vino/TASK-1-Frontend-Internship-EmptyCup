/**
 * @file script.js
 * @description Main JavaScript file for the 3D Solar System Simulation using Three.js.
 * This script handles the complete lifecycle of the simulation, including:
 * - Scene setup (camera, renderer, lighting).
 * - Dynamic loading and creation of celestial bodies (Sun, planets, Saturn's rings).
 * - Real-time animation of orbital and rotational movements.
 * - Interactive UI controls for global and individual planet speeds.
 * - Responsive design adjustments for various screen sizes.
 * - Advanced user interactions: planet labels on hover, camera focusing on click, and camera reset.
 * - Comprehensive loading manager with visual progress feedback.
 * - Robust error handling and a custom message box system for user notifications.
 * - Real-time debug information display (FPS, camera position, object count).
 * @author Vino K.
 * @date July 3, 2025
 * @version 1.0.0
 */

// =====================================================================================================================
// SECTION 1: GLOBAL THREE.JS VARIABLES AND CORE COMPONENTS
// These variables are declared globally to be accessible throughout the simulation lifecycle.
// They represent the fundamental building blocks of the Three.js scene.
// =====================================================================================================================
let scene;              // The Three.js Scene object, where all 3D objects, lights, and cameras reside.
let camera;             // The Three.js PerspectiveCamera, defining the viewpoint into the 3D scene.
let renderer;           // The Three.js WebGLRenderer, responsible for drawing the scene onto the HTML canvas.
let orbitControls;      // An instance of THREE.OrbitControls, enabling interactive camera movement (pan, zoom, rotate).
let clock;              // A Three.js Clock object, used for calculating delta time to ensure frame-rate independent animations.
let animationFrameId = null; // Stores the ID returned by `requestAnimationFrame`, used for pausing and resuming the animation loop.
let textureLoader;      // An instance of THREE.TextureLoader, used for asynchronously loading image textures.
let loadingManager;     // An instance of THREE.LoadingManager, used to track the progress of asset loading.

// =====================================================================================================================
// SECTION 2: SCENE CONFIGURATION CONSTANTS
// These constants define fundamental properties and parameters for the Three.js scene, camera,
// lighting, and other core visual elements. They are centralized for easy modification and tuning.
// =====================================================================================================================
const SCENE_CONSTANTS = {
    CAMERA_FOV: 75,             // Camera's field of view in degrees. A wider FOV can create a fisheye effect.
    CAMERA_NEAR: 0.1,           // Near clipping plane. Objects closer than this are not rendered. Prevents z-fighting close up.
    CAMERA_FAR: 2000,           // Far clipping plane. Objects farther than this are not rendered. Optimizes rendering performance.
    CAMERA_INITIAL_POSITION: { x: 0, y: 150, z: 300 }, // Starting position of the camera in 3D space (X, Y, Z coordinates).
    RENDERER_ANTIALIAS: true,   // Enables anti-aliasing for smoother edges on 3D objects, reducing pixelation.
    BACKGROUND_COLOR: 0x000000, // Hexadecimal color for the scene's background (black). This will be overridden by the stars texture.
    AMBIENT_LIGHT_COLOR: 0x333333, // Soft ambient light color. Provides a general illumination to prevent pure black shadows.
    SUN_LIGHT_COLOR: 0xFFFFFF,  // Color of the light emitted by the Sun (white).
    SUN_LIGHT_INTENSITY: 2,     // Intensity of the Sun's point light. Higher values make the scene brighter.
    ORBIT_PATH_COLOR: 0x555555, // Color for the orbital paths of planets (a subtle gray).
    ORBIT_PATH_OPACITY: 0.2,    // Opacity for the orbital paths (semi-transparent).
    STARFIELD_COUNT: 10000,     // Number of procedural stars to generate (if not using a texture).
    STARFIELD_RADIUS_FACTOR: 1.5, // Factor for starfield radius relative to camera far plane.
    CAMERA_FOCUS_SPEED: 0.05,   // Speed of camera interpolation during focus transitions. Lower value means slower transition.
    MIN_CAMERA_DISTANCE: 20,    // Minimum zoom-in distance for OrbitControls.
    MAX_CAMERA_DISTANCE: 1000,  // Maximum zoom-out distance for OrbitControls.
    MAX_POLAR_ANGLE: Math.PI / 2 // Restricts vertical camera orbit to prevent going below the "ground" plane.
};

// =====================================================================================================================
// SECTION 3: CELESTIAL BODIES DATA
// An array of objects, each defining the properties for the Sun and the eight major planets.
// These values are scaled for visual representation within the simulation and are not
// scientifically precise astronomical measurements. Textures are assumed to be locally hosted.
// =====================================================================================================================
const CELESTIAL_BODIES_DATA = [
    {
        name: 'Sun',
        radius: 10,             // Relative radius of the Sun in the simulation's scale.
        distance: 0,            // Distance from the center (Sun is positioned at the origin).
        orbitalSpeed: 0,        // The Sun does not orbit around a central point in this simulation.
        rotationSpeed: 0.005,   // Speed of the Sun's self-rotation on its axis.
        texture: './assets/textures/2k_sun.jpg', // Local path to the Sun's surface texture.
        isLightSource: true,    // Flag indicating this body emits light (used for material type).
        color: 0xFFA500         // Fallback color (Orange) if texture loading fails.
    },
    {
        name: 'Mercury',
        radius: 0.8,            // Relative radius.
        distance: 20,           // Orbital distance from the Sun.
        orbitalSpeed: 0.04,     // Faster orbital speed, characteristic of inner planets.
        rotationSpeed: 0.01,    // Speed of self-rotation.
        texture: './assets/textures/2k_mercury.jpg',
        color: 0xAAAAAA         // Fallback color (Gray).
    },
    {
        name: 'Venus',
        radius: 1.5,
        distance: 30,
        orbitalSpeed: 0.03,
        rotationSpeed: 0.008,
        texture: './assets/textures/2k_venus_surface.jpg',
        color: 0xCC9900         // Fallback color (Brownish-Yellow).
    },
    {
        name: 'Earth',
        radius: 1.8,
        distance: 45,
        orbitalSpeed: 0.025,
        rotationSpeed: 0.015,
        texture: './assets/textures/2k_earth_daymap.jpg',
        color: 0x0000FF         // Fallback color (Blue).
    },
    {
        name: 'Mars',
        radius: 1.2,
        distance: 60,
        orbitalSpeed: 0.02,
        rotationSpeed: 0.012,
        texture: './assets/textures/2k_mars.jpg',
        color: 0xFF0000         // Fallback color (Red).
    },
    {
        name: 'Jupiter',
        radius: 6,              // Significantly larger radius.
        distance: 90,
        orbitalSpeed: 0.01,     // Slower orbital speed, characteristic of outer planets.
        rotationSpeed: 0.007,
        texture: './assets/textures/2k_jupiter.jpg',
        color: 0xCCAA88         // Fallback color (Light Brown).
    },
    {
        name: 'Saturn',
        radius: 5,
        distance: 120,
        orbitalSpeed: 0.009,
        rotationSpeed: 0.006,
        texture: './assets/textures/2k_saturn.jpg',
        color: 0xDDAA66,        // Fallback color (Orange-Brown).
        hasRings: true,         // Custom property to indicate Saturn has rings.
        ringTexture: './assets/textures/2k_saturn_ring_alpha.png', // Local path to Saturn's ring texture.
        ringInnerRadiusFactor: 1.2, // Factor for inner ring radius relative to planet radius.
        ringOuterRadiusFactor: 2.5  // Factor for outer ring radius relative to planet radius.
    },
    {
        name: 'Uranus',
        radius: 3.5,
        distance: 150,
        orbitalSpeed: 0.007,
        rotationSpeed: 0.005,
        texture: './assets/textures/2k_uranus.jpg',
        color: 0xADD8E6         // Fallback color (Light Blue).
    },
    {
        name: 'Neptune',
        radius: 3.2,
        distance: 180,
        orbitalSpeed: 0.006,
        rotationSpeed: 0.004,
        texture: './assets/textures/2k_neptune.jpg',
        color: 0x00008B         // Fallback color (Dark Blue).
    }
];

// =====================================================================================================================
// SECTION 4: SIMULATION STATE VARIABLES
// These variables manage the current state of the simulation, including animation status,
// speed factors, and interaction-related data (e.g., raycasting, camera focus targets).
// =====================================================================================================================
const planets = [];             // Array to hold references to planet meshes and their orbit groups.
let sunMesh;                    // Reference to the Sun's mesh object, directly added to the scene.

let isPaused = false;           // Boolean flag to control animation pause/resume.
let globalSpeedFactor = 1.0;    // Multiplier for overall simulation speed, controlled by a UI slider.

// Raycasting variables for interactive elements (hover, click detection).
const raycaster = new THREE.Raycaster(); // Used for detecting intersections with 3D objects in the scene.
const mouse = new THREE.Vector2();       // Stores mouse coordinates in normalized device space (-1 to +1).
let intersectedObject = null;    // Stores the currently intersected 3D object during mouse hover.

// Camera focus variables for smooth transitions to specific planets.
let isCameraFocusing = false;    // Flag to indicate if the camera is currently in a focusing transition.
let cameraTargetPosition = new THREE.Vector3(); // The target position for the camera during a focus transition.
let cameraTargetLookAt = new THREE.Vector3();   // The target point for the camera to look at during a focus transition.

// Debugging and performance monitoring variables.
let lastFpsUpdateTime = 0;      // Timestamp of the last FPS update.
let frameCount = 0;             // Counter for frames rendered within an FPS measurement interval.

// =====================================================================================================================
// SECTION 5: UI ELEMENT REFERENCES
// References to HTML elements for user interaction, feedback, and debugging displays.
// These are populated during the UI setup phase.
// =====================================================================================================================
let toggleAnimationBtn;         // Button to pause/resume the simulation.
let globalSpeedSlider;          // Slider for controlling the global simulation speed.
let globalSpeedValueSpan;       // Span to display the current global speed value.
const planetSpeedSliders = {};  // Object to store individual planet speed sliders, keyed by planet name.
const planetSpeedValueSpans = {}; // Object to store individual planet speed value displays, keyed by planet name.
let loadingOverlay;             // The fullscreen loading screen element.
let loadingProgressBar;         // The visual progress bar within the loading screen.
let loadingProgressText;        // Text displaying the loading percentage.
let planetLabelElement;         // HTML element to display planet names on hover.
let resetCameraButton;          // Button to reset the camera to its initial view.
let messageBoxElement;          // Custom message box container.
let messageBoxTextElement;      // Text content area for the custom message box.
let messageBoxCloseButton;      // Close button for the custom message box.

// Debugging UI elements
let fpsDisplay;                 // Span to display current frames per second (FPS).
let objectCountDisplay;         // Span to display the number of rendered objects.
let cameraPosXDisplay;          // Span to display camera's X position.
let cameraPosYDisplay;          // Span to display camera's Y position.
let cameraPosZDisplay;          // Span to display camera's Z position.
let mouseNDCXDisplay;           // Span to display normalized device coordinates (NDC) X for mouse.
let mouseNDCYDisplay;           // Span to display normalized device coordinates (NDC) Y for mouse.
let animationStatusDisplay;     // Span to display animation paused/resumed status.
let focusStatusDisplay;         // Span to display camera focusing status.

// =====================================================================================================================
// SECTION 6: SOLARSYSTEMSIMULATION CLASS
// This class encapsulates all the logic for setting up, running, and managing the 3D solar system simulation.
// It follows an object-oriented approach to organize the codebase.
// =====================================================================================================================
class SolarSystemSimulation {
    /**
     * @constructor
     * @description Initializes the entire solar system simulation. This is the primary entry point
     * for setting up the Three.js scene, loading assets, configuring UI, and starting the animation loop.
     */
    constructor() {
        console.log('SolarSystemSimulation: Initializing the application...');
        try {
            // Step 1: Initialize the loading manager to track asset loading progress.
            this._initLoadingManager();
            // Step 2: Set up the fundamental Three.js scene, camera, and renderer.
            this._initScene();
            // Step 3: Configure and add lighting to the scene to illuminate celestial bodies.
            this._setupLights();
            // Step 4: Load textures for planets and background, then create their 3D meshes.
            this._loadTexturesAndCreateBodies();
            // Step 5: Get references to and initialize all HTML UI elements.
            this._setupUI();
            // Step 6: Attach event listeners to UI elements and the window for user interaction.
            this._addEventListeners();
            // Step 7: Handle initial window sizing for responsiveness.
            this._handleResize();

            console.log('SolarSystemSimulation: Initialization sequence complete. Awaiting asset loading to start animation.');
        } catch (error) {
            console.error('SolarSystemSimulation: Critical error during initialization:', error);
            this._showMessageBox('Critical Error', `Failed to initialize the solar system simulation: ${error.message}. Please check the console for more details and ensure your browser supports WebGL.`, 'error');
        }
    }

    /**
     * @private
     * @method _initLoadingManager
     * @description Sets up the Three.js LoadingManager to track asset loading progress.
     * This manager is crucial for displaying a loading screen to the user, providing feedback
     * and preventing a blank screen while large textures are being fetched.
     */
    _initLoadingManager() {
        console.log('LoadingManager: Initializing Three.js LoadingManager...');
        try {
            loadingManager = new THREE.LoadingManager();

            // Get references to all loading UI elements from the DOM.
            loadingOverlay = document.getElementById('loading-overlay');
            loadingProgressBar = document.getElementById('loading-progress-bar');
            loadingProgressText = document.getElementById('loading-progress-text');

            // Validate that all required loading UI elements are present in the DOM.
            if (!loadingOverlay || !loadingProgressBar || !loadingProgressText) {
                console.warn('LoadingManager: One or more loading UI elements are missing. Loading overlay will not function as expected.');
                // If UI elements are missing, configure the manager to log progress to console only.
                loadingManager.onStart = (url, itemsLoaded, itemsTotal) => console.log(`Loading started (UI elements missing). Total items: ${itemsTotal}`);
                loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => console.log(`Loaded ${itemsLoaded}/${itemsTotal}: ${url}`);
                loadingManager.onLoad = () => {
                    console.log('All assets loaded (UI elements missing). Starting animation.');
                    this.animate(); // Start animation directly if no overlay is possible.
                };
                loadingManager.onError = (url) => {
                    console.error('Error loading asset (UI elements missing):', url);
                    this._showMessageBox('Loading Error', `Failed to load some assets. Check console for details: ${url}`, 'warning');
                    this.animate(); // Still attempt to start animation with available assets.
                };
                this.textureLoader = new THREE.TextureLoader(loadingManager); // Assign manager to loader.
                return; // Exit the method as UI interaction is not possible.
            }

            // Callback function executed when the loading process starts.
            loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
                console.log(`LoadingManager: Loading process started. Expecting ${itemsTotal} assets.`);
                loadingOverlay.style.display = 'flex'; // Show the loading overlay by setting its display property.
                loadingOverlay.style.opacity = '1';    // Ensure it's fully opaque.
                loadingProgressText.textContent = 'Loading... 0%'; // Initialize progress text.
                loadingProgressBar.style.width = '0%'; // Initialize progress bar width.
            };

            // Callback function executed periodically during the loading progress.
            // It updates the visual progress bar and text.
            loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
                const progress = (itemsLoaded / itemsTotal) * 100; // Calculate percentage.
                loadingProgressText.textContent = `Loading... ${Math.round(progress)}%`; // Update text.
                loadingProgressBar.style.width = `${progress}%`; // Update bar width.
                console.log(`LoadingManager: Progress: ${Math.round(progress)}% - Loaded: ${url}`);
            };

            // Callback function executed when all assets have been successfully loaded.
            loadingManager.onLoad = () => {
                console.log('LoadingManager: All assets loaded successfully! Starting simulation.');
                loadingOverlay.style.opacity = '0'; // Start fading out the loading overlay.
                // After the fade-out transition, hide the overlay completely.
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                    loadingOverlay.style.pointerEvents = 'none'; // Disable pointer events after hidden.
                }, SCENE_CONSTANTS.LOADING_FADE_DURATION || 1000); // Default to 1s if not defined.
                this.animate(); // Crucially, start the main animation loop after loading is complete.
            };

            // Callback function executed if an error occurs during asset loading.
            loadingManager.onError = (url) => {
                console.error(`LoadingManager: Error loading asset: ${url}. Attempting to proceed with available assets.`);
                loadingProgressText.textContent = `Error loading some assets. Check console.`;
                this._showMessageBox('Loading Error', `Failed to load asset: ${url}. Simulation might be incomplete.`, 'warning');
                // Even on error, attempt to fade out the overlay and proceed to animation.
                loadingOverlay.style.opacity = '0';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                    loadingOverlay.style.pointerEvents = 'none';
                }, SCENE_CONSTANTS.LOADING_FADE_DURATION || 2000); // Longer fade on error.
                this.animate(); // Still try to start animation with what's loaded.
            };

            // Assign the configured LoadingManager to the TextureLoader.
            this.textureLoader = new THREE.TextureLoader(loadingManager);
            console.log('LoadingManager: Initialized successfully and linked to TextureLoader.');
        } catch (error) {
            console.error('Error during _initLoadingManager:', error);
            this._showMessageBox('Setup Error', `Failed to set up loading manager: ${error.message}.`, 'error');
            // Fallback: If loading manager setup fails, create a basic texture loader without it.
            this.textureLoader = new THREE.TextureLoader();
        }
    }

    /**
     * @private
     * @method _initScene
     * @description Initializes the fundamental components of the Three.js scene: the scene itself,
     * the camera, and the WebGL renderer. It also sets up OrbitControls for interactive camera navigation.
     */
    _initScene() {
        console.log('Scene: Initializing Three.js scene, camera, and renderer...');
        try {
            // Create a new Three.js Scene instance. This is the root of the 3D graph.
            scene = new THREE.Scene();
            // Set a default background color. This will be replaced by the starfield texture later.
            scene.background = new THREE.Color(SCENE_CONSTANTS.BACKGROUND_COLOR);
            console.log('Scene: New THREE.Scene created with default background.');

            // Create a PerspectiveCamera. This camera type is used for realistic 3D views.
            // Parameters: FOV (Field of View), Aspect Ratio, Near Clipping Plane, Far Clipping Plane.
            camera = new THREE.PerspectiveCamera(
                SCENE_CONSTANTS.CAMERA_FOV,
                window.innerWidth / window.innerHeight, // Aspect ratio dynamically set to window dimensions.
                SCENE_CONSTANTS.CAMERA_NEAR,
                SCENE_CONSTANTS.CAMERA_FAR
            );
            // Set the initial position of the camera in the 3D world coordinates.
            camera.position.set(
                SCENE_CONSTANTS.CAMERA_INITIAL_POSITION.x,
                SCENE_CONSTANTS.CAMERA_INITIAL_POSITION.y,
                SCENE_CONSTANTS.CAMERA_INITIAL_POSITION.z
            );
            // Make the camera look towards the origin (0,0,0), where the Sun will be placed.
            camera.lookAt(new THREE.Vector3(0, 0, 0));
            console.log('Camera: THREE.PerspectiveCamera initialized and positioned.');

            // Create a WebGLRenderer. This renderer uses the WebGL API to draw the scene onto a canvas.
            renderer = new THREE.WebGLRenderer({
                antialias: SCENE_CONSTANTS.RENDERER_ANTIALIAS, // Enable anti-aliasing for smoother edges.
                alpha: false // Disable alpha for background, as we'll use a texture.
            });
            // Set the size of the renderer to match the full window dimensions.
            renderer.setSize(window.innerWidth, window.innerHeight);
            // Adjust the renderer's pixel ratio for high-DPI (Retina) displays, ensuring crisp rendering.
            renderer.setPixelRatio(window.devicePixelRatio);
            console.log('Renderer: THREE.WebGLRenderer initialized and sized.');

            // Get the HTML container element where the canvas will be appended.
            const container = document.getElementById('solar-system-container');
            if (container) {
                // Append the renderer's DOM element (the <canvas> tag) to the specified container.
                container.appendChild(renderer.domElement);
                console.log('Renderer: Canvas appended to #solar-system-container.');
            } else {
                // Fallback: If the container element is not found, log an error and append to the body.
                console.error("Error: Could not find 'solar-system-container' element. Appending canvas directly to body.");
                document.body.appendChild(renderer.domElement);
                this._showMessageBox('DOM Error', 'Could not find the main simulation container. The canvas has been appended directly to the body. Please ensure the HTML structure is correct.', 'error');
            }

            // Initialize OrbitControls. These controls enable interactive camera movement.
            // They require the camera and the DOM element (canvas) to attach listeners.
            orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;     // Enables damping for smoother camera movement after user input.
            orbitControls.dampingFactor = 0.05;     // Damping factor. Higher values mean more damping (slower deceleration).
            orbitControls.screenSpacePanning = false; // Prevents panning in screen space, useful for 3D scenes.
            orbitControls.minDistance = SCENE_CONSTANTS.MIN_CAMERA_DISTANCE; // Minimum distance the camera can zoom in.
            orbitControls.maxDistance = SCENE_CONSTANTS.MAX_CAMERA_DISTANCE; // Maximum distance the camera can zoom out.
            orbitControls.maxPolarAngle = SCENE_CONSTANTS.MAX_POLAR_ANGLE; // Restricts vertical orbit to prevent camera from going below the "ground" plane.
            console.log('OrbitControls: Initialized with damping and distance limits.');

            // Initialize the Three.js Clock. This is used to calculate `deltaTime` between frames,
            // making animations frame-rate independent and consistent across different devices.
            clock = new THREE.Clock();
            console.log('Clock: THREE.Clock initialized for delta time calculations.');
        } catch (error) {
            console.error('Error during _initScene:', error);
            this._showMessageBox('Scene Setup Error', `Failed to initialize 3D scene components: ${error.message}.`, 'error');
        }
    }

    /**
     * @private
     * @method _setupLights
     * @description Configures and adds lighting to the Three.js scene.
     * This typically includes an AmbientLight for general illumination and a PointLight to simulate the Sun's light.
     */
    _setupLights() {
        console.log('Lights: Setting up scene lighting...');
        try {
            // Add an AmbientLight. This light illuminates all objects in the scene equally from all directions.
            // It helps to prevent parts of objects from being completely black in shadowed areas, providing soft base illumination.
            const ambientLight = new THREE.AmbientLight(SCENE_CONSTANTS.AMBIENT_LIGHT_COLOR);
            scene.add(ambientLight);
            console.log('Lights: AmbientLight added to the scene.');

            // Add a PointLight. This light emits light from a single point in all directions,
            // similar to a light bulb. It will simulate the Sun's illumination, casting shadows (if enabled on renderer).
            const sunLight = new THREE.PointLight(
                SCENE_CONSTANTS.SUN_LIGHT_COLOR,
                SCENE_CONSTANTS.SUN_LIGHT_INTENSITY,
                0 // Distance: 0 means the light has an infinite range, illuminating the entire scene.
            );
            // Position the Sun's light source at the origin (0,0,0), matching the Sun mesh's position.
            sunLight.position.set(0, 0, 0);
            scene.add(sunLight);
            console.log('Lights: PointLight (simulating Sun) added to the scene at origin.');

            // Optional: Add a helper to visualize the point light source in the scene.
            // This is useful for debugging light placement during development but can be commented out for production.
            // const pointLightHelper = new THREE.PointLightHelper(sunLight, 10); // Helper with size 10.
            // scene.add(pointLightHelper);
            // console.log('Lights: PointLightHelper added for debugging purposes.');

            // Enable shadows on the renderer (requires `renderer.shadowMap.enabled = true;` in _initScene)
            // and on the light source (`sunLight.castShadow = true;`) and objects (`mesh.castShadow = true; mesh.receiveShadow = true;`).
            // For simplicity, shadows are not fully implemented in this version to keep focus on core features.
        } catch (error) {
            console.error('Error during _setupLights:', error);
            this._showMessageBox('Lighting Error', `Failed to set up scene lights: ${error.message}.`, 'error');
        }
    }

    /**
     * @private
     * @method _loadTexturesAndCreateBodies
     * @description Manages the asynchronous loading of textures for all celestial bodies and the background.
     * After textures are loaded (or fail to load), it proceeds to create the 3D meshes for each body.
     * It uses Promises to handle the asynchronous nature of texture loading efficiently.
     */
    _loadTexturesAndCreateBodies() {
        console.log('Textures: Starting texture loading and celestial body creation process...');
        const textureLoaderInstance = this.textureLoader; // Use the textureLoader linked to the LoadingManager.

        // Define the path for the background stars texture.
        const starfieldTexturePath = './assets/textures/8k_stars_milky_way.jpg';

        // Load the background stars texture first. This texture will be applied to the scene's background.
        textureLoaderInstance.load(
            starfieldTexturePath,
            (texture) => {
                // Success callback: The starfield texture has loaded successfully.
                scene.background = texture; // Set the loaded texture as the scene's background.
                console.log('Textures: Stars background texture loaded successfully.');
            },
            undefined, // onProgress callback is handled by the global LoadingManager.
            (error) => {
                // Error callback: Failed to load background texture.
                console.error(`Error loading stars background texture from ${starfieldTexturePath}:`, error);
                // Fallback to a solid black background color if texture loading fails.
                scene.background = new THREE.Color(SCENE_CONSTANTS.BACKGROUND_COLOR);
                this._showMessageBox('Texture Load Error', `Failed to load starfield background: ${starfieldTexturePath}.`, 'warning');
            }
        );

        // Create an array of Promises, one for each celestial body's main texture.
        const bodyTexturePromises = [];
        CELESTIAL_BODIES_DATA.forEach(bodyData => {
            const promise = new Promise((resolve) => {
                // Load the main surface texture for the current celestial body.
                textureLoaderInstance.load(
                    bodyData.texture,
                    (texture) => {
                        // Success: Store the loaded texture object directly on the bodyData object.
                        bodyData.loadedTexture = texture;
                        console.log(`Textures: Main texture for ${bodyData.name} loaded successfully.`);
                        resolve(); // Resolve this promise, indicating completion for this texture.
                    },
                    undefined, // onProgress (handled by LoadingManager).
                    (error) => {
                        // Error: Log the error and mark the texture as null to indicate failure.
                        console.error(`Error loading main texture for ${bodyData.name} from ${bodyData.texture}:`, error);
                        bodyData.loadedTexture = null; // Indicate that texture loading failed for this body.
                        this._showMessageBox('Texture Load Error', `Failed to load texture for ${bodyData.name}: ${bodyData.texture}. Using fallback color.`, 'warning');
                        resolve(); // Resolve the promise anyway to allow `Promise.all` to complete.
                    }
                );
            });
            bodyTexturePromises.push(promise);

            // Special handling for Saturn: if it has rings and a ring texture path is provided.
            if (bodyData.name === 'Saturn' && bodyData.hasRings && bodyData.ringTexture) {
                const ringPromise = new Promise((resolve) => {
                    // Load Saturn's ring texture.
                    textureLoaderInstance.load(
                        bodyData.ringTexture,
                        (texture) => {
                            bodyData.loadedRingTexture = texture; // Store the loaded ring texture.
                            console.log(`Textures: Ring texture for ${bodyData.name} loaded successfully.`);
                            resolve();
                        },
                        undefined,
                        (error) => {
                            console.error(`Error loading ring texture for ${bodyData.name} from ${bodyData.ringTexture}:`, error);
                            bodyData.loadedRingTexture = null; // Mark ring texture as null on failure.
                            this._showMessageBox('Texture Load Error', `Failed to load ring texture for ${bodyData.name}: ${bodyData.ringTexture}. Rings might not appear.`, 'warning');
                            resolve(); // Resolve to allow main process to continue.
                        }
                    );
                });
                bodyTexturePromises.push(ringPromise); // Add ring texture promise to the array.
            }
        });

        // Use Promise.all to wait for all texture loading attempts (success or failure) to complete.
        Promise.all(bodyTexturePromises).then(() => {
            console.log('Textures: All celestial body textures processed. Proceeding to create 3D meshes.');
            // After all textures are processed, iterate through the data again to create the 3D meshes.
            CELESTIAL_BODIES_DATA.forEach(bodyData => {
                try {
                    if (bodyData.name === 'Sun') {
                        // For the Sun, create its mesh and add it directly to the scene.
                        sunMesh = this._createCelestialBody(
                            bodyData.radius,
                            bodyData.loadedTexture, // Pass loaded texture (or null if failed).
                            bodyData.color,
                            bodyData.isLightSource
                        );
                        scene.add(sunMesh); // Add the Sun directly to the scene's origin.
                        // Store a reference to the sun mesh on its data object for rotation updates in the animation loop.
                        bodyData.mesh = sunMesh;
                        console.log(`Body Created: ${bodyData.name} mesh added to scene.`);
                    } else {
                        // For planets, create the planet mesh and its orbital group.
                        const planetObject = this._createPlanetOrbit(
                            bodyData.radius,
                            bodyData.distance,
                            bodyData.orbitalSpeed,
                            bodyData.rotationSpeed,
                            bodyData.loadedTexture, // Pass loaded texture (or null if failed).
                            bodyData.color
                        );
                        // Store relevant planet data (mesh, orbit group, speeds, initial angle) in the 'planets' array.
                        planets.push({
                            name: bodyData.name,
                            mesh: planetObject.mesh,
                            orbitGroup: planetObject.orbitGroup,
                            orbitalSpeed: bodyData.orbitalSpeed,
                            rotationSpeed: bodyData.rotationSpeed,
                            orbitalSpeedFactor: 1.0, // Initialize individual speed factor to 1.0.
                            currentAngle: 0 // Initialize current orbital angle for animation calculations.
                        });
                        scene.add(planetObject.orbitGroup); // Add the orbit group (which contains the planet) to the scene.
                        console.log(`Body Created: ${bodyData.name} with orbit group added to scene.`);

                        // Special handling to create Saturn's rings if specified in its data.
                        if (bodyData.name === 'Saturn' && bodyData.hasRings) {
                            this._createSaturnRings(
                                planetObject.mesh, // Pass Saturn's mesh.
                                bodyData.loadedRingTexture, // Pass loaded ring texture (or null).
                                bodyData.ringInnerRadiusFactor,
                                bodyData.ringOuterRadiusFactor
                            );
                        }
                    }
                } catch (bodyCreationError) {
                    console.error(`Error creating celestial body ${bodyData.name}:`, bodyCreationError);
                    this._showMessageBox('Mesh Creation Error', `Failed to create 3D model for ${bodyData.name}: ${bodyCreationError.message}.`, 'error');
                }
            });
            console.log('Celestial body mesh creation process completed for all defined bodies.');
        }).catch(allPromisesError => {
            // This catch block would only be hit if Promise.all itself fails, which is rare.
            // Individual texture errors are handled and resolved within their own promises.
            console.error('An unexpected error occurred during Promise.all for texture loading:', allPromisesError);
            this._showMessageBox('Critical Loading Error', `An unexpected error occurred during texture processing: ${allPromisesError.message}.`, 'error');
            // Even if Promise.all fails, the individual texture loaders would have logged errors.
            // We still try to create bodies with fallback colors as a last resort.
            CELESTIAL_BODIES_DATA.forEach(bodyData => {
                try {
                    if (bodyData.name === 'Sun') {
                        sunMesh = this._createCelestialBody(bodyData.radius, null, bodyData.color, bodyData.isLightSource);
                        scene.add(sunMesh);
                    } else {
                        const planetObject = this._createPlanetOrbit(bodyData.radius, bodyData.distance, bodyData.orbitalSpeed, bodyData.rotationSpeed, null, bodyData.color);
                        planets.push({
                            name: bodyData.name,
                            mesh: planetObject.mesh,
                            orbitGroup: planetObject.orbitGroup,
                            orbitalSpeed: bodyData.orbitalSpeed,
                            rotationSpeed: bodyData.rotationSpeed,
                            orbitalSpeedFactor: 1.0,
                            currentAngle: 0
                        });
                        scene.add(planetObject.orbitGroup);
                        if (bodyData.name === 'Saturn' && bodyData.hasRings) {
                            this._createSaturnRings(planetObject.mesh, null, bodyData.ringInnerRadiusFactor, bodyData.ringOuterRadiusFactor);
                        }
                    }
                } catch (fallbackBodyCreationError) {
                    console.error(`Error creating fallback celestial body ${bodyData.name}:`, fallbackBodyCreationError);
                }
            });
            console.warn('Celestial bodies created with fallbacks due to texture loading issues or unexpected errors.');
        });
    }

    /**
     * @private
     * @method _createCelestialBody
     * @description Creates a 3D sphere mesh for a celestial body (either the Sun or a planet).
     * It handles applying textures or fallback colors and sets up appropriate material properties
     * based on whether the body is a light source or reflects light.
     * @param {number} radius - The radius of the sphere geometry for the celestial body.
     * @param {THREE.Texture|null} texture - The Three.js Texture object to apply to the surface, or `null` if loading failed.
     * @param {number} fallbackColor - A hexadecimal color value to use if the texture is not available or fails to load.
     * @param {boolean} isLightSource - A boolean flag: `true` if the body emits light (like the Sun), `false` otherwise.
     * @returns {THREE.Mesh} The created Three.js Mesh object representing the celestial body.
     */
    _createCelestialBody(radius, texture, fallbackColor, isLightSource = false) {
        try {
            // Create a SphereGeometry. High segment counts (64x64) ensure a smooth, detailed sphere.
            const geometry = new THREE.SphereGeometry(radius, 64, 64);
            console.log(`_createCelestialBody: SphereGeometry created with radius ${radius}.`);

            let material;
            if (isLightSource) {
                // For the Sun (which emits its own light), use MeshBasicMaterial.
                // This material is not affected by other lights in the scene and can be made to glow.
                material = new THREE.MeshBasicMaterial({
                    map: texture || null, // Apply the loaded texture if available, otherwise no map.
                    // If a texture is present, use white color so the texture's colors are fully visible.
                    // If no texture, use the provided fallback color directly.
                    color: texture ? 0xFFFFFF : fallbackColor,
                    // The emissive property makes the material glow, simulating the Sun's light emission.
                    emissive: texture ? 0xFFFFFF : fallbackColor, // Emissive color matches the body's color/texture.
                    emissiveIntensity: 1 // Full intensity for the glow effect.
                });
                console.log('_createCelestialBody: MeshBasicMaterial (light source) created.');
            } else {
                // For planets (which reflect light from the Sun), use MeshStandardMaterial.
                // This material reacts realistically to lights in the scene and supports physically based rendering (PBR).
                material = new THREE.MeshStandardMaterial({
                    map: texture || null, // Apply the loaded texture if available.
                    color: texture ? 0xFFFFFF : fallbackColor, // White for texture, fallback color otherwise.
                    roughness: 0.8, // Defines how rough the surface is (0 = perfectly smooth, 1 = perfectly rough).
                    metalness: 0.1,  // Defines how metallic the surface is (0 = dielectric/non-metal, 1 = metallic).
                    // Optional: normalMap, aoMap, displacementMap could be added here for more detail.
                });
                console.log('_createCelestialBody: MeshStandardMaterial (planet) created.');
            }

            // Create the Mesh by combining the defined geometry and material.
            const mesh = new THREE.Mesh(geometry, material);
            // Assign a custom property to identify this as a planet mesh for raycasting (hover/click).
            mesh.isPlanet = !isLightSource; // True if it's a planet, false if it's the Sun.
            // Assign a unique name to the mesh for easier identification during debugging and interaction.
            mesh.name = isLightSource ? 'Sun' : `Planet_${CELESTIAL_BODIES_DATA.find(d => d.radius === radius && d.isLightSource === isLightSource)?.name || 'Unknown'}`;
            console.log(`_createCelestialBody: Mesh created for ${mesh.name} with radius ${radius}.`);
            return mesh;
        } catch (error) {
            console.error(`_createCelestialBody: Error creating celestial body with radius ${radius}:`, error);
            this._showMessageBox('3D Model Error', `Failed to create 3D model for a celestial body: ${error.message}. A placeholder will be used.`, 'error');
            // Return a basic fallback mesh to prevent application crash.
            return new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshBasicMaterial({ color: fallbackColor }));
        }
    }

    /**
     * @private
     * @method _createPlanetOrbit
     * @description Creates a planet mesh and an orbital group (THREE.Object3D) for it.
     * The planet mesh is added as a child to the orbital group. This group is then
     * positioned and rotated to simulate the planet's orbit around the Sun.
     * An orbital path (a thin ring) is also added for visual guidance of the trajectory.
     * @param {number} radius - The radius of the planet's sphere geometry.
     * @param {number} distance - The orbital distance of the planet from the Sun (center of the scene).
     * @param {number} orbitalSpeed - The base speed at which the planet orbits around the Sun.
     * @param {number} rotationSpeed - The base speed at which the planet rotates on its own axis.
     * @param {THREE.Texture|null} texture - The Three.js Texture object for the planet's surface.
     * @param {number} fallbackColor - A hexadecimal color to use if the texture is not available.
     * @returns {object} An object containing the planet's mesh and its orbital group.
     */
    _createPlanetOrbit(radius, distance, orbitalSpeed, rotationSpeed, texture, fallbackColor) {
        try {
            // Create an Object3D. This acts as a pivot point or container for the planet.
            // By rotating this group around the scene's origin, the planet (as its child) will orbit.
            const orbitGroup = new THREE.Object3D();
            // Store the initial orbital speed and distance on the group for animation calculations.
            orbitGroup.orbitalSpeed = orbitalSpeed;
            orbitGroup.distance = distance;
            // Assign a custom property to identify this as a planet's orbit group for specific logic (e.g., raycasting).
            orbitGroup.isPlanetOrbitGroup = true;
            console.log(`_createPlanetOrbit: OrbitGroup created for orbital distance ${distance}.`);

            // Create the planet's actual 3D sphere mesh using the helper function.
            const planetMesh = this._createCelestialBody(radius, texture, fallbackColor, false); // Not a light source.
            // Assign a unique name to the planet mesh for identification (e.g., "Planet_Earth").
            planetMesh.name = `Planet_${CELESTIAL_BODIES_DATA.find(d => d.radius === radius && d.distance === distance)?.name || 'Unknown'}`;
            console.log(`_createPlanetOrbit: Planet mesh created for ${planetMesh.name}.`);

            // Position the planet mesh relative to its orbit group's center.
            // This means the planet will be 'distance' units away from the orbit group's pivot point.
            // When the orbit group rotates, the planet will move in a circle around the scene's origin.
            planetMesh.position.set(distance, 0, 0);

            // Store the self-rotation speed directly on the planet mesh for individual rotation animation.
            planetMesh.rotationSpeed = rotationSpeed;

            // Add the planet mesh as a child of the orbit group.
            // This establishes the parent-child relationship crucial for orbital motion.
            orbitGroup.add(planetMesh);
            console.log(`_createPlanetOrbit: Planet mesh ${planetMesh.name} added as child to its orbit group.`);

            // Optional: Add an orbital path (a thin circle) for visual guidance of the planet's trajectory.
            const orbitPathGeometry = new THREE.RingGeometry(distance - 0.1, distance + 0.1, 128); // Create a thin ring.
            const orbitPathMaterial = new THREE.MeshBasicMaterial({
                color: SCENE_CONSTANTS.ORBIT_PATH_COLOR, // Dark gray color for the path.
                side: THREE.DoubleSide, // Render both sides of the ring for visibility from all angles.
                transparent: true,      // Enable transparency for the material.
                opacity: SCENE_CONSTANTS.ORBIT_PATH_OPACITY, // Set desired opacity.
                depthWrite: false       // Prevents the ring from writing to the depth buffer, avoiding z-fighting issues.
            });
            const orbitPath = new THREE.Mesh(orbitPathGeometry, orbitPathMaterial);
            // Rotate the path to lie flat on the XZ plane (the typical orbital plane).
            orbitPath.rotation.x = Math.PI / 2; // Rotate by 90 degrees around the X-axis.
            scene.add(orbitPath); // Add the orbit path directly to the scene, not to the orbit group, so it remains static.
            console.log(`_createPlanetOrbit: Orbital path created for ${planetMesh.name} at distance ${distance}.`);

            return { mesh: planetMesh, orbitGroup: orbitGroup };
        } catch (error) {
            console.error(`_createPlanetOrbit: Error creating planet orbit for distance ${distance}:`, error);
            this._showMessageBox('Planet Orbit Error', `Failed to create orbit for a planet: ${error.message}. A basic fallback will be used.`, 'error');
            // Return a fallback structure to prevent application crash.
            const fallbackOrbitGroup = new THREE.Object3D();
            const fallbackMesh = this._createCelestialBody(radius, null, fallbackColor, false);
            fallbackMesh.position.set(distance, 0, 0);
            fallbackOrbitGroup.add(fallbackMesh);
            return { mesh: fallbackMesh, orbitGroup: fallbackOrbitGroup };
        }
    }

    /**
     * @private
     * @method _createSaturnRings
     * @description Creates and adds a ring system to the Saturn mesh.
     * It loads a specific texture for the rings and applies it, handling fallback colors if needed.
     * @param {THREE.Mesh} saturnMesh - The Three.js Mesh object representing Saturn.
     * @param {THREE.Texture|null} ringTexture - The Three.js Texture object for Saturn's rings, or `null` if loading failed.
     * @param {number} innerRadiusFactor - A factor to calculate the inner radius of the rings relative to Saturn's radius.
     * @param {number} outerRadiusFactor - A factor to calculate the outer radius of the rings relative to Saturn's radius.
     */
    _createSaturnRings(saturnMesh, ringTexture, innerRadiusFactor, outerRadiusFactor) {
        console.log('Saturn Rings: Attempting to create rings for Saturn...');
        try {
            // Calculate the inner and outer radii for Saturn's rings based on factors of Saturn's radius.
            const innerRadius = saturnMesh.geometry.parameters.radius * innerRadiusFactor;
            const outerRadius = saturnMesh.geometry.parameters.radius * outerRadiusFactor;
            const segments = 64; // Number of segments for the ring geometry, higher for smoother appearance.

            // Create a RingGeometry for the rings.
            const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, segments);
            console.log('Saturn Rings: RingGeometry created.');

            let ringMaterial;
            if (ringTexture) {
                // If a ring texture is available, create a MeshBasicMaterial with the texture.
                // MeshBasicMaterial is suitable for rings as they don't typically cast/receive complex shadows
                // in simplified solar system simulations and are self-illuminating from the Sun's light.
                ringMaterial = new THREE.MeshBasicMaterial({
                    map: ringTexture,       // Apply the loaded ring texture.
                    side: THREE.DoubleSide, // Render both sides of the ring for visibility from all angles.
                    transparent: true,      // Enable transparency to allow the alpha channel in the texture to work.
                    opacity: 0.8,           // Adjust overall opacity of the rings.
                    alphaTest: 0.01,        // Prevents rendering very faint pixels, improving performance.
                    depthWrite: false       // Crucial: Prevents the rings from writing to the depth buffer,
                                            // which can cause rendering artifacts (z-fighting) with the planet.
                });
                console.log('Saturn Rings: MeshBasicMaterial with texture created for rings.');
            } else {
                // Fallback: If ring texture loading failed, create rings with a simple gray color.
                console.warn('Saturn Rings: Ring texture not available, using fallback color for rings.');
                ringMaterial = new THREE.MeshBasicMaterial({
                    color: 0x888888,        // A default gray color.
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.4,           // Lower opacity for a more subtle fallback.
                    depthWrite: false
                });
            }

            // Create the ring mesh by combining the geometry and material.
            const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
            // Rotate the rings to be flat on the XZ plane, aligning with Saturn's equatorial plane.
            ringMesh.rotation.x = Math.PI / 2; // Rotate by 90 degrees (PI/2 radians) around the X-axis.
            // Add the rings as a child of Saturn's mesh.
            // This ensures the rings move and rotate along with Saturn itself.
            saturnMesh.add(ringMesh);
            console.log('Saturn Rings: Rings mesh successfully added to Saturn.');
        } catch (error) {
            console.error('Error creating Saturn rings:', error);
            this._showMessageBox('Ring Creation Error', `Failed to create Saturn's rings: ${error.message}.`, 'error');
        }
    }

    /**
     * @private
     * @method _setupUI
     * @description Gets references to all necessary HTML UI elements from the DOM and initializes their
     * display values. This method ensures that the JavaScript can effectively interact with and update
     * the HTML controls and information displays.
     */
    _setupUI() {
        console.log('UI Setup: Getting references to UI elements and initializing displays...');
        try {
            // Get reference to the animation toggle button.
            toggleAnimationBtn = document.getElementById('toggle-animation-btn');
            if (!toggleAnimationBtn) console.warn("UI Setup: 'toggle-animation-btn' element not found in DOM.");

            // Get references to the global speed slider and its value display span.
            globalSpeedSlider = document.getElementById('global-speed-slider');
            globalSpeedValueSpan = document.getElementById('global-speed-value');
            if (!globalSpeedSlider) console.warn("UI Setup: 'global-speed-slider' element not found.");
            if (!globalSpeedValueSpan) console.warn("UI Setup: 'global-speed-value' element not found.");

            // Initialize global speed display if elements are found.
            if (globalSpeedSlider && globalSpeedValueSpan) {
                globalSpeedValueSpan.textContent = `${parseFloat(globalSpeedSlider.value).toFixed(2)}x`;
                console.log('UI Setup: Global speed slider display initialized.');
            }

            // Get references for individual planet speed sliders and their value displays.
            // Iterate through celestial bodies data, excluding the Sun, to find corresponding UI elements.
            CELESTIAL_BODIES_DATA.filter(body => body.name !== 'Sun').forEach(body => {
                const sliderId = `${body.name.toLowerCase()}-speed-slider`;
                const valueSpanId = `${body.name.toLowerCase()}-speed-value`;

                const slider = document.getElementById(sliderId);
                const valueSpan = document.getElementById(valueSpanId);

                if (slider && valueSpan) {
                    // Store references in the respective objects for easy access later.
                    planetSpeedSliders[body.name] = slider;
                    planetSpeedValueSpans[body.name] = valueSpan;
                    // Initialize display for individual planet speed based on its default slider value.
                    valueSpan.textContent = `${parseFloat(slider.value).toFixed(2)}x`;
                    console.log(`UI Setup: Slider and value span for ${body.name} initialized.`);
                } else {
                    console.warn(`UI Setup: Could not find slider or value span for ${body.name}. Expected IDs: ${sliderId}, ${valueSpanId}`);
                }
            });

            // Get reference to the planet label element for hover display.
            planetLabelElement = document.getElementById('planet-label');
            if (!planetLabelElement) console.warn("UI Setup: 'planet-label' element not found.");

            // Get reference to the reset camera button.
            resetCameraButton = document.getElementById('reset-camera-btn');
            if (!resetCameraButton) console.warn("UI Setup: 'reset-camera-btn' element not found.");

            // Get references for the custom message box elements.
            messageBoxElement = document.getElementById('custom-message-box');
            messageBoxTextElement = document.getElementById('message-box-text');
            messageBoxCloseButton = document.getElementById('message-box-close');
            if (!messageBoxElement || !messageBoxTextElement || !messageBoxCloseButton) {
                console.warn("UI Setup: One or more custom message box elements not found. Custom alerts will not function.");
            } else {
                console.log('UI Setup: Custom message box elements found.');
            }

            // Get references for debug information display elements.
            fpsDisplay = document.getElementById('fps-display');
            objectCountDisplay = document.getElementById('object-count');
            cameraPosXDisplay = document.getElementById('camera-pos-x');
            cameraPosYDisplay = document.getElementById('camera-pos-y');
            cameraPosZDisplay = document.getElementById('camera-pos-z');
            mouseNDCXDisplay = document.getElementById('mouse-ndc-x');
            mouseNDCYDisplay = document.getElementById('mouse-ndc-y');
            animationStatusDisplay = document.getElementById('animation-status');
            focusStatusDisplay = document.getElementById('focus-status');

            // Log warnings if any debug elements are missing.
            if (!fpsDisplay || !objectCountDisplay || !cameraPosXDisplay || !cameraPosYDisplay || !cameraPosZDisplay ||
                !mouseNDCXDisplay || !mouseNDCYDisplay || !animationStatusDisplay || !focusStatusDisplay) {
                console.warn("UI Setup: One or more debug display elements not found. Debug info will be incomplete.");
            } else {
                console.log('UI Setup: All debug display elements found.');
            }

            console.log('UI Setup: All UI elements processed and initialized.');
        } catch (error) {
            console.error('Error during _setupUI:', error);
            this._showMessageBox('UI Setup Error', `Failed to set up user interface elements: ${error.message}. Some controls may not work.`, 'error');
        }
    }

    /**
     * @private
     * @method _addEventListeners
     * @description Attaches event listeners to various UI elements and the window object.
     * This enables user interaction with the simulation, including resizing, button clicks,
     * slider adjustments, and mouse interactions for camera control and planet hovering/clicking.
     */
    _addEventListeners() {
        console.log('Event Listeners: Attaching all event listeners...');
        try {
            // Event listener for window resize, to make the canvas and UI responsive.
            // Using `bind(this)` ensures that `this` inside `_handleResize` refers to the SolarSystemSimulation instance.
            window.addEventListener('resize', this._handleResize.bind(this));
            console.log('Event Listener: Window resize listener added.');

            // Event listener for the animation toggle button (Pause/Resume).
            if (toggleAnimationBtn) {
                toggleAnimationBtn.addEventListener('click', this._toggleAnimation.bind(this));
                console.log('Event Listener: Toggle animation button listener added.');
            }

            // Event listener for the global speed slider.
            if (globalSpeedSlider && globalSpeedValueSpan) {
                globalSpeedSlider.addEventListener('input', (event) => {
                    // Update the global speed factor based on the slider's current value.
                    globalSpeedFactor = parseFloat(event.target.value);
                    // Update the displayed value in the UI, formatted to two decimal places.
                    globalSpeedValueSpan.textContent = `${globalSpeedFactor.toFixed(2)}x`;
                    console.log(`Global Speed: Updated to ${globalSpeedFactor.toFixed(2)}x`);
                });
                console.log('Event Listener: Global speed slider listener added.');
            }

            // Event listeners for individual planet speed sliders.
            // Iterate through each planet object in the `planets` array.
            planets.forEach(planet => {
                const slider = planetSpeedSliders[planet.name];
                const valueSpan = planetSpeedValueSpans[planet.name];

                if (slider && valueSpan) {
                    slider.addEventListener('input', (event) => {
                        // Update the planet's individual orbital speed factor.
                        // This factor is then applied multiplicatively with the global speed factor in the animation loop.
                        const newFactor = parseFloat(event.target.value);
                        planet.orbitalSpeedFactor = newFactor; // Store this factor directly on the planet object.
                        // Update the displayed value for the individual planet, formatted.
                        valueSpan.textContent = `${newFactor.toFixed(2)}x`;
                        console.log(`Event Listener: ${planet.name} Speed updated to ${newFactor.toFixed(2)}x`);
                    });
                    // Initialize the individual speed factor for each planet based on its default slider value.
                    // This ensures correct speed even if the slider is not explicitly touched initially.
                    planet.orbitalSpeedFactor = parseFloat(slider.value);
                    console.log(`Event Listener: Individual speed slider for ${planet.name} added and initialized.`);
                }
            });

            // Event listener for mouse movement on the renderer's canvas for raycasting (hover effect).
            if (renderer && renderer.domElement) {
                renderer.domElement.addEventListener('mousemove', this._onMouseMove.bind(this));
                console.log('Event Listener: Mousemove listener added for raycasting (planet hover).');
            }

            // Event listener for mouse click on the renderer's canvas for camera focus.
            if (renderer && renderer.domElement) {
                renderer.domElement.addEventListener('click', this._onMouseClick.bind(this));
                console.log('Event Listener: Click listener added for camera focus on planets.');
            }

            // Event listener for the reset camera button.
            if (resetCameraButton) {
                resetCameraButton.addEventListener('click', this._resetCamera.bind(this));
                console.log('Event Listener: Reset camera button listener added.');
            }

            // Event listener for the custom message box close button.
            if (messageBoxCloseButton) {
                messageBoxCloseButton.addEventListener('click', this._closeMessageBox.bind(this));
                console.log('Event Listener: Custom message box close button listener added.');
            }

            console.log('Event Listeners: All event listeners successfully attached.');
        } catch (error) {
            console.error('Error during _addEventListeners:', error);
            this._showMessageBox('Event Listener Error', `Failed to attach some event listeners: ${error.message}. Some interactions may not work.`, 'error');
        }
    }

    /**
     * @private
     * @method _handleResize
     * @description Adjusts the camera's aspect ratio and the renderer's size whenever the browser window
     * is resized. This ensures the 3D simulation remains responsive and fills the screen correctly,
     * preventing distortion and maintaining visual integrity.
     */
    _handleResize() {
        try {
            // Update the camera's aspect ratio to match the new window dimensions.
            // This is crucial to prevent distortion of the 3D scene when the window size changes.
            camera.aspect = window.innerWidth / window.innerHeight;
            // After changing the aspect ratio, the camera's projection matrix needs to be recalculated.
            camera.updateProjectionMatrix();
            console.log('Camera: Aspect ratio updated on window resize.');

            // Update the renderer's size to match the new window dimensions.
            // This ensures the rendered 3D scene fills the entire available canvas area.
            renderer.setSize(window.innerWidth, window.innerHeight);
            // Re-apply the pixel ratio to ensure crisp rendering on high-DPI (Retina) displays.
            renderer.setPixelRatio(window.devicePixelRatio);
            console.log(`Renderer: Size updated to ${window.innerWidth}x${window.innerHeight} on resize.`);
        } catch (error) {
            console.error('Error during _handleResize:', error);
            this._showMessageBox('Resize Error', `Failed to adjust simulation for window resize: ${error.message}. Display may be distorted.`, 'error');
        }
    }

    /**
     * @private
     * @method _toggleAnimation
     * @description Toggles the animation state between paused and resumed.
     * It stops or starts the `requestAnimationFrame` loop and updates the button text
     * and icon to reflect the current simulation state.
     */
    _toggleAnimation() {
        try {
            isPaused = !isPaused; // Invert the boolean state of the `isPaused` flag.
            const playIcon = document.getElementById('play-icon');
            const pauseIcon = document.getElementById('pause-icon');

            if (isPaused) {
                // If the simulation is now paused:
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId); // Cancel the ongoing animation frame request.
                    animationFrameId = null; // Clear the stored animation frame ID.
                }
                // Update the button text and icons to indicate the 'Resume' state.
                toggleAnimationBtn.querySelector('.button-text').textContent = 'Resume Simulation';
                if (playIcon) playIcon.style.display = 'inline-block';
                if (pauseIcon) pauseIcon.style.display = 'none';
                if (animationStatusDisplay) animationStatusDisplay.textContent = 'Yes';
                console.log('Simulation: Animation paused.');
            } else {
                // If the simulation is now resumed:
                this.animate(); // Restart the main animation loop.
                // Update the button text and icons to indicate the 'Pause' state.
                toggleAnimationBtn.querySelector('.button-text').textContent = 'Pause Simulation';
                if (playIcon) playIcon.style.display = 'none';
                if (pauseIcon) pauseIcon.style.display = 'inline-block';
                if (animationStatusDisplay) animationStatusDisplay.textContent = 'No';
                console.log('Simulation: Animation resumed.');
            }
        } catch (error) {
            console.error('Error during _toggleAnimation:', error);
            this._showMessageBox('Animation Control Error', `Failed to toggle animation: ${error.message}.`, 'error');
        }
    }

    /**
     * @private
     * @method _onMouseMove
     * @description Event handler for mouse movement on the renderer's canvas.
     * It updates the `mouse` vector with normalized device coordinates and triggers raycasting
     * to detect which planets are currently being hovered over, updating the planet label.
     * @param {MouseEvent} event - The native mousemove event object.
     */
    _onMouseMove(event) {
        try {
            // Calculate mouse position in normalized device coordinates (NDC).
            // NDC range from -1 to +1, where (-1,-1) is bottom-left and (1,1) is top-right.
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1; // Y-axis is inverted in Three.js.

            // Update debug info for mouse coordinates.
            if (mouseNDCXDisplay) mouseNDCXDisplay.textContent = mouse.x.toFixed(3);
            if (mouseNDCYDisplay) mouseNDCYDisplay.textContent = mouse.y.toFixed(3);
        } catch (error) {
            console.error('Error during _onMouseMove:', error);
            // No message box here to avoid spamming for frequent events.
        }
    }

    /**
     * @private
     * @method _onMouseClick
     * @description Event handler for mouse clicks on the renderer's canvas.
     * It uses raycasting to determine if a planet was clicked. If a planet is detected,
     * it initiates a smooth camera focusing animation towards that planet.
     * @param {MouseEvent} event - The native click event object.
     */
    _onMouseClick(event) {
        try {
            // Prevent OrbitControls from interfering if we handle the click.
            // This is a common pattern, but OrbitControls might need to be temporarily disabled.
            // For now, we let OrbitControls handle its own logic and just perform our raycast.

            // Update the raycaster with the current camera and mouse position.
            raycaster.setFromCamera(mouse, camera);

            // Find all objects that intersect with the ray.
            // We specifically look for objects that have the `isPlanet` custom property set to true.
            const intersects = raycaster.intersectObjects(
                planets.map(p => p.mesh), // Create an array of all actual planet meshes for intersection testing.
                false // `false` means don't recursively check children of children (we only care about the planet mesh itself).
            );

            if (intersects.length > 0) {
                // An object was clicked. Get the first intersected object (which is the closest one).
                const clickedObject = intersects[0].object;
                console.log('Click: Object clicked:', clickedObject.name);

                // Ensure the clicked object is indeed a planet mesh (double-check custom property).
                if (clickedObject.isPlanet) {
                    // Get the world position of the clicked planet.
                    const targetPlanetPosition = new THREE.Vector3();
                    clickedObject.getWorldPosition(targetPlanetPosition);

                    // Determine the new camera position for focusing.
                    // We want the camera to be slightly behind and above the planet for a good view.
                    // The offset is proportional to the planet's radius to ensure consistent framing regardless of planet size.
                    cameraTargetPosition.copy(targetPlanetPosition);
                    cameraTargetPosition.add(new THREE.Vector3(
                        clickedObject.geometry.parameters.radius * 2, // Offset X (can be 0 if only Y/Z offset is desired)
                        clickedObject.geometry.parameters.radius * 3, // Offset Y (above the planet)
                        clickedObject.geometry.parameters.radius * 5  // Offset Z (behind the planet)
                    ));

                    // The camera should look directly at the center of the clicked planet.
                    cameraTargetLookAt.copy(targetPlanetPosition);

                    isCameraFocusing = true; // Set the flag to true to start the camera focusing animation.
                    console.log(`Camera Focus: Initiating smooth focus on ${clickedObject.name}.`);
                } else {
                    console.log('Click: Clicked object is not a planet mesh. No camera focus initiated.');
                }
            } else {
                // If no object was clicked or the clicked object was not a planet.
                if (isCameraFocusing) {
                    // If the camera was previously focusing, stop the focus if the user clicks elsewhere.
                    isCameraFocusing = false;
                    console.log('Camera Focus: No planet clicked, stopping active camera focus.');
                }
            }
        } catch (error) {
            console.error('Error during _onMouseClick:', error);
            this._showMessageBox('Interaction Error', `An error occurred during mouse click handling: ${error.message}.`, 'error');
        }
    }

    /**
     * @private
     * @method _resetCamera
     * @description Resets the camera to its initial predefined position and orientation.
     * This function is typically invoked when a "Reset Camera" button is clicked,
     * providing a quick way to return to the default overview of the solar system.
     */
    _resetCamera() {
        console.log('Camera: Resetting camera to initial position and look-at target.');
        try {
            // Set the target position for the camera back to its initial predefined coordinates.
            cameraTargetPosition.set(
                SCENE_CONSTANTS.CAMERA_INITIAL_POSITION.x,
                SCENE_CONSTANTS.CAMERA_INITIAL_POSITION.y,
                SCENE_CONSTANTS.CAMERA_INITIAL_POSITION.z
            );
            // Set the target point for the camera to look at back to the origin (0,0,0), which is where the Sun is.
            cameraTargetLookAt.set(0, 0, 0);

            isCameraFocusing = true; // Activate the camera focusing flag to trigger a smooth transition.
            console.log('Camera: Smooth transition to initial view initiated.');
        } catch (error) {
            console.error('Error during _resetCamera:', error);
            this._showMessageBox('Camera Reset Error', `Failed to reset camera view: ${error.message}.`, 'error');
        }
    }

    /**
     * @private
     * @method _updateCameraFocus
     * @description Smoothly interpolates the camera's position and its look-at target
     * towards the `cameraTargetPosition` and `cameraTargetLookAt` respectively.
     * This creates a gradual, smooth focusing or resetting effect for the camera.
     * It is called in every animation frame when `isCameraFocusing` is true.
     */
    _updateCameraFocus() {
        // If camera focusing is not active, there's nothing to do.
        if (!isCameraFocusing) {
            if (focusStatusDisplay) focusStatusDisplay.textContent = 'No';
            return;
        }

        try {
            // Interpolate camera position towards the target position using linear interpolation (lerp).
            // `CAMERA_FOCUS_SPEED` determines how fast the camera moves towards the target.
            camera.position.lerp(cameraTargetPosition, SCENE_CONSTANTS.CAMERA_FOCUS_SPEED);

            // Interpolate camera look-at point towards the target look-at.
            // OrbitControls' target needs to be updated for seamless transition and continued control.
            orbitControls.target.lerp(cameraTargetLookAt, SCENE_CONSTANTS.CAMERA_FOCUS_SPEED);
            orbitControls.update(); // Update controls to reflect the new target.

            // Apply the new look-at target to the camera directly.
            camera.lookAt(orbitControls.target);

            // Check if the camera is very close to its target position and look-at point.
            // If it's close enough, stop the focusing animation to save resources and prevent floating-point inaccuracies.
            const distanceToTargetPosition = camera.position.distanceTo(cameraTargetPosition);
            const distanceToTargetLookAt = orbitControls.target.distanceTo(cameraTargetLookAt);

            // Define a small threshold for considering the camera "at" its target.
            const threshold = 0.1;

            if (distanceToTargetPosition < threshold && distanceToTargetLookAt < threshold) {
                isCameraFocusing = false; // Deactivate focusing once targets are reached.
                console.log('Camera Focus: Reached target, stopping interpolation.');
                // Snap to exact target to avoid minor floating point inaccuracies.
                camera.position.copy(cameraTargetPosition);
                orbitControls.target.copy(cameraTargetLookAt);
                camera.lookAt(orbitControls.target);
                orbitControls.update(); // Final update to ensure controls are aligned.
                if (focusStatusDisplay) focusStatusDisplay.textContent = 'No';
            } else {
                if (focusStatusDisplay) focusStatusDisplay.textContent = 'Yes';
            }
        } catch (error) {
            console.error('Error during _updateCameraFocus:', error);
            this._showMessageBox('Camera Focus Error', `An error occurred during camera focus update: ${error.message}.`, 'error');
            isCameraFocusing = false; // Stop focusing on error.
        }
    }

    /**
     * @private
     * @method _updatePlanetPositions
     * @description Updates the orbital and rotational positions of all planets and the Sun for the current frame.
     * It uses `deltaTime` to ensure animations are consistent across different frame rates, preventing
     * faster or slower motion on machines with varying performance.
     * @param {number} deltaTime - The time elapsed since the last animation frame, in seconds.
     */
    _updatePlanetPositions(deltaTime) {
        // Only update positions if the simulation is not paused.
        if (isPaused) {
            return;
        }

        try {
            // Update the Sun's self-rotation on its axis.
            // The rotation speed is influenced by its base rotation speed and the global speed factor.
            const sunData = CELESTIAL_BODIES_DATA.find(body => body.name === 'Sun');
            if (sunMesh && sunData) {
                sunMesh.rotation.y += sunData.rotationSpeed * deltaTime * globalSpeedFactor;
            }

            // Iterate through each planet to update its orbital and self-rotation.
            planets.forEach(planet => {
                // Calculate the effective orbital speed for the current planet.
                // This combines its base orbital speed, its individual slider factor, and the global speed factor.
                const effectiveOrbitalSpeed = planet.orbitalSpeed * (planet.orbitalSpeedFactor || 1) * globalSpeedFactor;

                // Update the planet's current orbital angle.
                // The angle increases over time, causing the planet to move in a circle around the Sun.
                planet.currentAngle += effectiveOrbitalSpeed * deltaTime;

                // Set the position of the planet's orbit group based on the current angle and its distance from the Sun.
                // This moves the entire orbit group (and thus the planet within it) around the scene's origin.
                planet.orbitGroup.position.x = Math.cos(planet.currentAngle) * planet.orbitGroup.distance;
                planet.orbitGroup.position.z = Math.sin(planet.currentAngle) * planet.orbitGroup.distance;

                // Calculate the effective self-rotation speed for the planet.
                // This combines its base rotation speed, its individual slider factor, and the global speed factor.
                const effectiveRotationSpeed = planet.rotationSpeed * (planet.orbitalSpeedFactor || 1) * globalSpeedFactor;
                // Rotate the planet mesh on its own axis (typically the Y-axis for celestial rotation).
                planet.mesh.rotation.y += effectiveRotationSpeed * deltaTime;
            });
        } catch (error) {
            console.error('Error during _updatePlanetPositions:', error);
            // No message box here to avoid spamming for frequent updates.
        }
    }

    /**
     * @private
     * @method _updatePlanetLabels
     * @description Updates the visibility and position of the HTML planet label on mouse hover.
     * This function is called in the animation loop to constantly check for intersections
     * between the mouse ray and planet meshes.
     */
    _updatePlanetLabels() {
        try {
            // Update the raycaster to reflect the current mouse position and camera view.
            raycaster.setFromCamera(mouse, camera);

            // Find all objects that intersect with the ray.
            // We are only interested in the actual planet meshes for hovering.
            const intersects = raycaster.intersectObjects(
                planets.map(p => p.mesh), // Create an array of all planet meshes to check for intersection.
                false // `false` means don't recursively check children of children.
            );

            if (intersects.length > 0) {
                // An object is currently intersected. Get the first (closest) intersected object.
                const firstIntersected = intersects[0].object;

                // Check if the intersected object is a planet and if it's a new intersection (different from previous).
                if (firstIntersected.isPlanet && intersectedObject !== firstIntersected) {
                    intersectedObject = firstIntersected; // Store the newly intersected object.
                    // Set the text content of the planet label, removing "Planet_" prefix if present.
                    planetLabelElement.textContent = intersectedObject.name.replace('Planet_', '');
                    planetLabelElement.style.display = 'block'; // Show the label.
                    planetLabelElement.style.opacity = '1'; // Ensure it's fully visible.
                    console.log(`Hover: Intersected ${intersectedObject.name}`);
                }
            } else {
                // No object is currently intersected, or the mouse moved off the previous object.
                if (intersectedObject) {
                    // If there was a previously intersected object, hide the label.
                    planetLabelElement.style.opacity = '0'; // Start fading out the label.
                    // After a short delay (matching CSS transition), set display to 'none'.
                    setTimeout(() => {
                        if (planetLabelElement) planetLabelElement.style.display = 'none';
                    }, 200); // Match or slightly exceed CSS transition duration for opacity.
                    intersectedObject = null; // Clear the reference to the intersected object.
                    console.log('Hover: No longer intersecting any planet.');
                }
            }

            // Update the position of the label to follow the mouse cursor.
            // This makes the label appear dynamically next to the hovered planet.
            // Convert normalized device coordinates to screen coordinates (pixels).
            const labelX = (mouse.x + 1) / 2 * window.innerWidth;
            const labelY = (-mouse.y + 1) / 2 * window.innerHeight;
            // Apply position with a small offset to prevent the label from obscuring the cursor.
            if (planetLabelElement) {
                planetLabelElement.style.left = `${labelX + 10}px`; // Offset by 10px to the right.
                planetLabelElement.style.top = `${labelY + 10}px`;  // Offset by 10px downwards.
            }
        } catch (error) {
            console.error('Error during _updatePlanetLabels:', error);
            // No message box here to avoid spamming for frequent events.
        }
    }

    /**
     * @private
     * @method _updateDebugInfo
     * @description Updates the various debug information displays in the UI, such as FPS,
     * rendered object count, and camera position. This is useful for monitoring performance
     * and debugging the simulation in real-time.
     */
    _updateDebugInfo() {
        try {
            // Update FPS (Frames Per Second) display.
            frameCount++;
            const currentTime = performance.now(); // Get current high-resolution timestamp.

            // Update FPS every second.
            if (currentTime >= lastFpsUpdateTime + 1000) {
                const fps = (frameCount * 1000) / (currentTime - lastFpsUpdateTime);
                if (fpsDisplay) fpsDisplay.textContent = fps.toFixed(1); // Display FPS with one decimal place.
                lastFpsUpdateTime = currentTime;
                frameCount = 0;
            }

            // Update rendered object count.
            // `scene.children.length` gives a rough count, but a more accurate count would iterate
            // through all meshes, which can be performance intensive.
            if (objectCountDisplay) {
                let meshCount = 0;
                scene.traverse((object) => {
                    if (object.isMesh) {
                        meshCount++;
                    }
                });
                objectCountDisplay.textContent = meshCount;
            }

            // Update camera position display.
            if (cameraPosXDisplay) cameraPosXDisplay.textContent = camera.position.x.toFixed(2);
            if (cameraPosYDisplay) cameraPosYDisplay.textContent = camera.position.y.toFixed(2);
            if (cameraPosZDisplay) cameraPosZDisplay.textContent = camera.position.z.toFixed(2);

            // Update animation status.
            if (animationStatusDisplay) animationStatusDisplay.textContent = isPaused ? 'Yes' : 'No';

            // Update camera focus status.
            if (focusStatusDisplay) focusStatusDisplay.textContent = isCameraFocusing ? 'Yes' : 'No';

        } catch (error) {
            console.error('Error during _updateDebugInfo:', error);
            // No message box here to avoid spamming.
        }
    }

    /**
     * @private
     * @method _showMessageBox
     * @description Displays a custom modal-like message box to the user. This function replaces
     * the native browser `alert()` for a more integrated and aesthetically pleasing user experience.
     * @param {string} title - The title of the message box (though currently hidden by `sr-only` for accessibility).
     * @param {string} message - The main text content of the message to be displayed.
     * @param {string} type - Optional. A string indicating the type of message (e.g., 'info', 'warning', 'error').
     * Can be used to apply specific styling.
     */
    _showMessageBox(title, message, type = 'info') {
        try {
            if (!messageBoxElement || !messageBoxTextElement) {
                console.error('Custom message box elements not found. Falling back to console log:', message);
                console.log(`Message Type: ${type}, Title: ${title}`);
                return;
            }

            // Set the message text.
            messageBoxTextElement.textContent = message;

            // Apply type-specific styling (e.g., color for error messages).
            // This would require additional CSS rules for `.message-box-text.error`, etc.
            messageBoxTextElement.className = `message-text ${type}`; // Add type class.

            // Set the aria-hidden attribute to false to make it accessible to screen readers.
            messageBoxElement.setAttribute('aria-hidden', 'false');

            // Make the message box visible.
            messageBoxElement.style.display = 'flex'; // Ensure flex display for centering.
            // The opacity transition is handled by CSS, setting display to flex makes it visible.
            console.log(`Message Box Displayed: Type='${type}', Message='${message}'`);
        } catch (error) {
            console.error('Error displaying custom message box:', error);
            // Fallback to native alert if custom message box fails.
            alert(`Error displaying message: ${message}. Original error: ${error.message}`);
        }
    }

    /**
     * @private
     * @method _closeMessageBox
     * @description Hides the custom message box from the user's view.
     */
    _closeMessageBox() {
        try {
            if (messageBoxElement) {
                // Start fading out the message box.
                messageBoxElement.style.opacity = '0';
                // Set aria-hidden to true to hide it from screen readers.
                messageBoxElement.setAttribute('aria-hidden', 'true');

                // After the CSS transition completes, set display to 'none' to fully remove it from layout.
                setTimeout(() => {
                    if (messageBoxElement) {
                        messageBoxElement.style.display = 'none';
                        messageBoxElement.style.pointerEvents = 'none'; // Disable pointer events when hidden.
                    }
                }, SCENE_CONSTANTS.MESSAGE_BOX_FADE_DURATION || 300); // Default to 0.3s if not defined.
                console.log('Message Box: Closed.');
            }
        } catch (error) {
            console.error('Error closing custom message box:', error);
        }
    }

    /**
     * @method animate
     * @description The main animation loop for the Three.js scene.
     * This function is called repeatedly using `requestAnimationFrame` to create continuous motion
     * and update the 3D simulation. It ensures smooth animations synchronized with the browser's refresh rate.
     */
    animate() {
        // Request the next animation frame. This creates a continuous loop.
        // `bind(this)` ensures that `this` context inside `animate` refers to the SolarSystemSimulation instance.
        animationFrameId = requestAnimationFrame(this.animate.bind(this));

        // Get the delta time (time elapsed since the last frame) from the clock.
        // Using delta time makes animations frame-rate independent, ensuring consistent speed on all devices.
        const deltaTime = clock.getDelta();

        // Update OrbitControls. This processes user input for camera movement (pan, zoom, rotate).
        // It must be called in the animation loop if `enableDamping` is true.
        orbitControls.update();

        // Update the positions and rotations of all planets and the Sun.
        // This function contains the core logic for celestial body movement.
        this._updatePlanetPositions(deltaTime);

        // Update the planet labels on hover, checking for mouse intersections.
        this._updatePlanetLabels();

        // Smoothly move the camera if a focus target is set (e.g., after clicking a planet).
        this._updateCameraFocus();

        // Update real-time debug information displayed in the UI.
        this._updateDebugInfo();

        // Render the scene using the camera. This draws everything to the canvas.
        renderer.render(scene, camera);
    }
}

// =====================================================================================================================
// SECTION 7: INITIALIZATION LOGIC
// This section contains the logic to initialize the Three.js simulation. It ensures that
// the simulation starts only after all necessary external libraries (Three.js and OrbitControls)
// are fully loaded and available in the global scope.
// =====================================================================================================================

/**
 * @function initializeSimulationWhenReady
 * @description Checks if Three.js and OrbitControls libraries are loaded and available globally.
 * If they are, it initializes the SolarSystemSimulation. Otherwise, it waits and retries after a short delay.
 * This prevents errors from trying to use undefined global objects before scripts have fully loaded.
 */
function initializeSimulationWhenReady() {
    console.log('Initialization: Checking for Three.js and OrbitControls library availability...');
    // Check if the global THREE object and THREE.OrbitControls constructor are defined.
    if (typeof THREE !== 'undefined' && typeof THREE.OrbitControls !== 'undefined') {
        console.log('Initialization: Three.js and OrbitControls are loaded. Proceeding to initialize simulation...');
        try {
            // Create a new instance of the SolarSystemSimulation class.
            // This effectively starts the entire application, triggering its constructor.
            window.solarSystemApp = new SolarSystemSimulation();
            console.log('Initialization: SolarSystemSimulation instance successfully created.');
        } catch (error) {
            console.error('Initialization: Failed to create SolarSystemSimulation instance:', error);
            // Display a user-friendly error message if initialization fails.
            const errorMessageDiv = document.createElement('div');
            errorMessageDiv.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background-color: rgba(255, 0, 0, 0.8); color: white; padding: 20px;
                border-radius: 8px; font-family: 'Inter', sans-serif; z-index: 9999;
                text-align: center; border: 2px solid #ff5555;
            `;
            errorMessageDiv.innerHTML = `
                <h3>Application Error</h3>
                <p>Failed to load the Solar System simulation. This might be due to a browser issue or missing files.</p>
                <p>Please ensure your browser supports WebGL and try refreshing the page.</p>
                <p>Error details: <code>${error.message}</code></p>
                <button onclick="window.location.reload()" style="margin-top: 15px; padding: 10px 20px; background-color: #4299E1; color: white; border: none; border-radius: 5px; cursor: pointer;">Reload Page</button>
            `;
            document.body.appendChild(errorMessageDiv);
        }
    } else {
        // If libraries are not yet loaded, log a message and try again after a short delay.
        console.log('Initialization: Waiting for Three.js and OrbitControls to load... Retrying in 100ms.');
        setTimeout(initializeSimulationWhenReady, 100); // Recursive call after 100 milliseconds.
    }
}

// Attach the initialization function to the window's `onload` event.
// This ensures that the script runs only after the entire page (including all external scripts and resources) has loaded.
window.onload = initializeSimulationWhenReady;

// =====================================================================================================================
// END OF script.js
// =====================================================================================================================

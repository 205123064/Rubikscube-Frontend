import * as sceneSetup from './sceneSetup.js';
import { RubiksCube } from './RubiksCube.js';
import { initializeControls } from './uiController.js';

// 1. Initialize the 3D environment
const { scene, camera, renderer, controls } = sceneSetup.init();

// 2. Create the Rubik's Cube instance
const cube = new RubiksCube(scene);

// 3. Set up the UI button listeners
initializeControls(cube);

// 4. Start the animation loop
sceneSetup.startAnimationLoop(renderer, scene, camera, controls);
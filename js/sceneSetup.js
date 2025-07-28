import * as THREE from 'three';
// Correctly import OrbitControls from the 'addons' path
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function init() {
    const container = document.getElementById('canvas-container');

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 10);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Controls - THIS IS THE FIX
    // REMOVED "THREE." from the line below
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 5);
    scene.add(directionalLight);
    
    // Handle window resizing
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }, false);

    return { scene, camera, renderer, controls };
}

export function startAnimationLoop(renderer, scene, camera, controls) {
    function animate() {
        requestAnimationFrame(animate);
        TWEEN.update();
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}
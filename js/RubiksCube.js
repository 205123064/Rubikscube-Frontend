import * as THREE from 'three';

const cubieSize = 1;
const spacing = 0.05;
const totalSize = cubieSize + spacing;

const backendColors = {
    Y: 0xffd500, // Yellow for UP
    W: 0xffffff, // White for DOWN
    B: 0x0045ad, // Blue for FRONT
    G: 0x009b48, // Green for BACK
    R: 0xb90000, // Red for RIGHT
    O: 0xff5900, // Orange for LEFT
    INNER: 0x111111
};

export class RubiksCube {
    constructor(scene) {
        this.scene = scene;
        this.cubies = [];
        this.isAnimating = false;
        this.createCube();
    }

    createCube() {
        const colors = backendColors;

        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    if (x === 0 && y === 0 && z === 0) continue;

                    const materials = [
                        new THREE.MeshStandardMaterial({ color: x === 1 ? colors.R : colors.INNER }),  // Right face
                        new THREE.MeshStandardMaterial({ color: x === -1 ? colors.O : colors.INNER }), // Left face
                        new THREE.MeshStandardMaterial({ color: y === 1 ? colors.Y : colors.INNER }),  // Up face
                        new THREE.MeshStandardMaterial({ color: y === -1 ? colors.W : colors.INNER }), // Down face
                        new THREE.MeshStandardMaterial({ color: z === 1 ? colors.B : colors.INNER }),  // Front face
                        new THREE.MeshStandardMaterial({ color: z === -1 ? colors.G : colors.INNER })  // Back face
                    ];

                    const geometry = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);
                    const cubie = new THREE.Mesh(geometry, materials);
                    cubie.position.set(x * totalSize, y * totalSize, z * totalSize);

                    const edgeGeometry = new THREE.EdgesGeometry(geometry);
                    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 4 });
                    cubie.add(new THREE.LineSegments(edgeGeometry, edgeMaterial));

                    this.cubies.push(cubie);
                    this.scene.add(cubie);
                }
            }
        }
    }
    setControls(buttons) {
        this.controls = buttons;
    }

    toggleControls(enabled) {
        if (!this.controls) return;
        this.controls.forEach(btn => {
            btn.disabled = !enabled;
            btn.style.opacity = enabled ? 1 : 0.5;
        });
    }

    reset() {
        if (this.isAnimating) return;
        while (this.cubies.length > 0) {
            const cubie = this.cubies.pop();
            if (cubie.geometry) cubie.geometry.dispose();
            if (cubie.material) {
                if (Array.isArray(cubie.material)) cubie.material.forEach(m => m.dispose());
                else cubie.material.dispose();
            }
            this.scene.remove(cubie);
        }
        this.createCube();
        const solutionDisplay = document.getElementById('solution-display');
        solutionDisplay.innerHTML=`<p class="text-gray-500 text-base font-mono">Solution will appear here...</p>`;
    }

    // In the RubiksCube class within js/RubiksCube.js

    move(notation) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.toggleControls(false); // Disable buttons at the start of the move

        const pivot = new THREE.Object3D();
        const angle = (notation.includes("'") ? 1 : -1) * Math.PI / 2; // FIX: U' should be positive angle for Y-up
        const axis = new THREE.Vector3(0, 0, 0);
        let layer = [];
        const threshold = 0.5;

        // IMPORTANT: The rotation direction depends on the axis.
        // Standard notation assumes you're looking at the face.
        // U/D rotate around Y, L/R rotate around X, F/B rotate around Z.
        // A positive rotation for U (Y-axis) is counter-clockwise.
        // We adjust the angle here to match standard notation.
        let correctedAngle = angle;

        switch (notation.charAt(0)) {
            case 'U': axis.set(0, 1, 0); layer = this.cubies.filter(c => c.position.y > threshold); correctedAngle = angle * -1; break;
            case 'D': axis.set(0, 1, 0); layer = this.cubies.filter(c => c.position.y < -threshold); correctedAngle = angle; break;
            case 'L': axis.set(1, 0, 0); layer = this.cubies.filter(c => c.position.x < -threshold); correctedAngle = angle; break;
            case 'R': axis.set(1, 0, 0); layer = this.cubies.filter(c => c.position.x > threshold); correctedAngle = angle * -1; break;
            case 'F': axis.set(0, 0, 1); layer = this.cubies.filter(c => c.position.z > threshold); correctedAngle = angle * -1; break;
            case 'B': axis.set(0, 0, 1); layer = this.cubies.filter(c => c.position.z < -threshold); correctedAngle = angle; break;
        }

        // Attach all cubies in the selected layer to the pivot
        layer.forEach(cubie => pivot.add(cubie));
        this.scene.add(pivot);

        // Animate the pivot's rotation
        new TWEEN.Tween(pivot.rotation)
            .to({ x: axis.x * correctedAngle, y: axis.y * correctedAngle, z: axis.z * correctedAngle }, 300)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                // This is the critical section that needed fixing
                pivot.updateMatrixWorld(); // Ensure pivot's world matrix is up-to-date

                for (const cubie of [...pivot.children]) {
                    // STEP 1: Get the cubie's new world matrix after rotation
                    const worldPosition = new THREE.Vector3();
                    const worldQuaternion = new THREE.Quaternion();
                    cubie.getWorldPosition(worldPosition);
                    cubie.getWorldQuaternion(worldQuaternion);
                    this.scene.attach(cubie);
                    cubie.position.set(
                        Math.round(cubie.position.x / totalSize) * totalSize,
                        Math.round(cubie.position.y / totalSize) * totalSize,
                        Math.round(cubie.position.z / totalSize) * totalSize
                    );
                }

                // Clean up the pivot object
                this.scene.remove(pivot);
                this.isAnimating = false;
                this.toggleControls(true); // Re-enable buttons when the move is finished

            })
            .start();
    }

    scramble() {
        if (this.isAnimating) return;
        const moves = ['U', 'D', 'L', 'R', 'F', 'B', "U'", "D'", "L'", "R'", "F'", "B'"];
        let i = 0;
        const performNextMove = () => {
            if (i < 9) {
                this.move(moves[Math.floor(Math.random() * moves.length)]);
                i++;
                setTimeout(performNextMove, 350);
            }
        };
        performNextMove();
    }

    // In js/RubiksCube.js
    animateSolution(solutionString) {
        if (this.isAnimating) return;

        // This helper function converts the backend notation (e.g., 'f')
        // to the frontend's move notation (e.g., "F'").
        const convertNotation = (move) => {
            // Uppercase from backend is clockwise, which is a prime move in the UI's logic.
            if (move >= 'A' && move <= 'Z') {
                return move + "'";
            }
            // Lowercase from backend is counter-clockwise, which is a normal move in the UI.
            else if (move >= 'a' && move <= 'z') {
                return move.toUpperCase();
            }
            return null; // Should not happen with valid input
        };

        const moves = solutionString.split('').map(convertNotation).filter(m => m !== null);

        if (moves.length === 0) {
            console.log("Cube is already solved.");
            return;
        }

        let i = 0;
        const performNextMove = () => {
            if (i < moves.length) {
                this.move(moves[i]);
                i++;
                // Use a timeout to create a delay between each move in the animation.
                setTimeout(performNextMove, 350); // 350ms delay
            }
        };

        console.log("Starting solution animation...");
        performNextMove();
    }
// ... (constructor, createCube, move, scramble, and reset methods remain the same)


        getCubeState() {
            if (this.isAnimating) {
                console.warn("Animation in progress. Aborting getState.");
                return null;
            }

            const colorHexMap = {
                'ffd500': 'Y', 'ffffff': 'W', '0045ad': 'B',
                '009b48': 'G', 'b90000': 'R', 'ff5900': 'O'
            };

            const state = {};
            const raycaster = new THREE.Raycaster();
            const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000); // A temporary camera

            const facesToScan = [
                { name: 'U', position: [0, 8, 0], lookAt: [0, 0, 0] },
                { name: 'L', position: [-8, 0, 0], lookAt: [0, 0, 0] },
                { name: 'F', position: [0, 0, 8], lookAt: [0, 0, 0] },
                { name: 'R', position: [8, 0, 0], lookAt: [0, 0, 0] },
                { name: 'B', position: [0, 0, -8], lookAt: [0, 0, 0] },
                { name: 'D', position: [-0, -8, 0], lookAt: [0, 0, 0] }
            ];

            facesToScan.forEach(faceInfo => {
                camera.position.set(...faceInfo.position);
                camera.lookAt(...faceInfo.lookAt);
                camera.updateMatrixWorld(); // Important: update camera's matrices

                const faceColors = [];
                // Create a 3x3 grid in the camera's view
                for (let y = 1; y > -2; y--) {
                    for (let x = -1; x < 2; x++) {
                        // Map the grid point to normalized device coordinates (-1 to +1)
                        const ndc = new THREE.Vector2(x * 0.3, y * 0.3);
                        raycaster.setFromCamera(ndc, camera);

                        const intersects = raycaster.intersectObjects(this.cubies);

                        if (intersects.length > 0) {
                            const materialIndex = intersects[0].face.materialIndex;
                            const colorHex = intersects[0].object.material[materialIndex].color.getHexString();
                            faceColors.push(colorHexMap[colorHex]);
                        } else {
                            faceColors.push('?'); // Should not happen in a valid state
                        }
                    }
                }
                state[faceInfo.name] = faceColors;
            });

            // Assemble the final string in the correct Kociemba order.
            return (
                state.U.join('') + state.R.join('') + state.F.join('') +
                state.D.join('') + state.L.join('') + state.B.join('')
            );
        }
}

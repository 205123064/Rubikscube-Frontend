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

    move(notation) {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.toggleControls(false); 

        const pivot = new THREE.Object3D();
        const angle = (notation.includes("'") ? -Math.PI / 2 : Math.PI / 2);
        const axis = new THREE.Vector3(0, 0, 0);
        let layer = [];
        const threshold = 0.5;

        let correctedAngle = angle;

        switch (notation.charAt(0)) {
            case 'U': axis.set(0, 1, 0); layer = this.cubies.filter(c => c.position.y > threshold); correctedAngle = angle * -1; break;
            case 'D': axis.set(0, 1, 0); layer = this.cubies.filter(c => c.position.y < -threshold); correctedAngle = angle; break;
            case 'L': axis.set(1, 0, 0); layer = this.cubies.filter(c => c.position.x < -threshold); correctedAngle = angle; break;
            case 'R': axis.set(1, 0, 0); layer = this.cubies.filter(c => c.position.x > threshold); correctedAngle = angle * -1; break;
            case 'F': axis.set(0, 0, 1); layer = this.cubies.filter(c => c.position.z > threshold); correctedAngle = angle * -1; break;
            case 'B': axis.set(0, 0, 1); layer = this.cubies.filter(c => c.position.z < -threshold); correctedAngle = angle; break;
        }

        layer.forEach(cubie => pivot.add(cubie));
        this.scene.add(pivot);

        new TWEEN.Tween(pivot.rotation)
            .to({ x: axis.x * correctedAngle, y: axis.y * correctedAngle, z: axis.z * correctedAngle }, 300)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onComplete(() => {
                pivot.updateMatrixWorld(); 

                for (const cubie of [...pivot.children]) {
                    this.scene.attach(cubie);
                    cubie.position.set(
                        Math.round(cubie.position.x / totalSize) * totalSize,
                        Math.round(cubie.position.y / totalSize) * totalSize,
                        Math.round(cubie.position.z / totalSize) * totalSize
                    );
                }

                this.scene.remove(pivot);
                this.isAnimating = false;
                this.toggleControls(true); 

            })
            .start();
    }

    scramble() {
        if (this.isAnimating) return;
        const moves = ['U', 'D', 'L', 'R', 'F', 'B', "U'", "D'", "L'", "R'", "F'", "B'"];
        let i = 0;
        const performNextMove = () => {
            if (i < 20) { // A 20-move scramble
                this.move(moves[Math.floor(Math.random() * moves.length)]);
                i++;
                setTimeout(performNextMove, 350);
            }
        };
        performNextMove();
    }

    animateSolution(solutionString) {
        if (this.isAnimating) return;

        const convertNotation = (move) => {
            if (move >= 'A' && move <= 'Z') {
                return move;
            } else if (move >= 'a' && move <= 'z') {
                return move.toUpperCase() + "'";
            }
            return null;
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
                setTimeout(performNextMove, 350);
            }
        };

        console.log("Starting solution animation...");
        performNextMove();
    }

    getCubeState() {
        if (this.isAnimating) {
            console.warn("Animation in progress. Aborting getState.");
            return null;
        }

        const colorHexMap = {
            'ffd500': 'Y', 'ffffff': 'W', '0045ad': 'B',
            '009b48': 'G', 'b90000': 'R', 'ff5900': 'O'
        };

        const state = { U: [], R: [], F: [], D: [], L: [], B: [] };
        const localFaceNormals = [
            { dir: new THREE.Vector3(1, 0, 0), name: 'R' }, { dir: new THREE.Vector3(-1, 0, 0), name: 'L' },
            { dir: new THREE.Vector3(0, 1, 0), name: 'U' }, { dir: new THREE.Vector3(0, -1, 0), name: 'D' },
            { dir: new THREE.Vector3(0, 0, 1), name: 'F' }, { dir: new THREE.Vector3(0, 0, -1), name: 'B' }
        ];

        const stickers = [];
        this.cubies.forEach(cubie => {
            for (let i = 0; i < cubie.material.length; i++) {
                const colorHex = cubie.material[i].color.getHexString();
                if (colorHex === '111111') continue;

                const worldNormal = localFaceNormals[i].dir.clone().applyQuaternion(cubie.quaternion).round();
                stickers.push({
                    position: cubie.position.clone(),
                    color: colorHexMap[colorHex],
                    normal: worldNormal
                });
            }
        });

        Object.keys(state).forEach(faceName => {
            const faceNormal = localFaceNormals.find(f => f.name === faceName).dir;
            const faceStickers = stickers.filter(s => s.normal.equals(faceNormal));

            // ⭐ FIX: This is the corrected sorting logic for all faces to ensure Kociemba order.
            faceStickers.sort((a, b) => {
                const posA = a.position;
                const posB = b.position;
                if (faceName === 'U') {
                    return posA.z - posB.z || posA.x - posB.x;
                }
                if (faceName === 'D') {
                    return posB.z - posA.z || posA.x - posB.x;
                }
                if (faceName === 'F') {
                    return posB.y - posA.y || posA.x - posB.x;
                }
                if (faceName === 'B') {
                    return posB.y - posA.y || posB.x - posA.x;
                }
                if (faceName === 'R') {
                    return posB.y - posA.y || posB.z - posA.z;
                }
                if (faceName === 'L') {
                    return posB.y - posA.y || posA.z - posB.z;
                }
                return 0;
            });
            state[faceName] = faceStickers.map(s => s.color);
        });

        const faceOrder = ['U', 'R', 'F', 'D', 'L', 'B'];
        let str = "";
        faceOrder.forEach(face => {
            str += state[face].join('');
        });

        const counts = {};
        for(const char of str) { counts[char] = (counts[char] || 0) + 1; }
        const isValid = Object.values(counts).every(c => c === 9) && str.length === 54;
        
        if (!isValid) {
            console.error("CRITICAL ERROR: Generated an invalid cube string.", str, counts);
            return null;
        }
        
        return str;
    }
}

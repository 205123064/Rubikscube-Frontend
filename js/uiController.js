import { solveCube } from './apiService.js';

export function initializeControls(cube) {
    
    const controlButtons = [
        document.getElementById('btn-u'), document.getElementById('btn-l'),
        document.getElementById('btn-f'), document.getElementById('btn-r'),
        document.getElementById('btn-b'), document.getElementById('btn-d'),
        document.getElementById('btn-u-prime'), document.getElementById('btn-l-prime'),
        document.getElementById('btn-f-prime'), document.getElementById('btn-r-prime'),
        document.getElementById('btn-b-prime'), document.getElementById('btn-d-prime'),
        document.getElementById('btn-scramble'), document.getElementById('btn-reset'),
        document.getElementById('btn-solve')
    ];

    cube.setControls(controlButtons);

    // Standard moves
    document.getElementById('btn-u').onclick = () => cube.move("U'"); // Note: Your HTML has U' and U swapped
    document.getElementById('btn-l').onclick = () => cube.move("L'");
    document.getElementById('btn-f').onclick = () => cube.move("F'");
    document.getElementById('btn-r').onclick = () => cube.move("R'");
    document.getElementById('btn-b').onclick = () => cube.move("B'");
    document.getElementById('btn-d').onclick = () => cube.move("D'");

    // Prime moves
    document.getElementById('btn-u-prime').onclick = () => cube.move('U');
    document.getElementById('btn-l-prime').onclick = () => cube.move('L');
    document.getElementById('btn-f-prime').onclick = () => cube.move('F');
    document.getElementById('btn-r-prime').onclick = () => cube.move('R');
    document.getElementById('btn-b-prime').onclick = () => cube.move('B');
    document.getElementById('btn-d-prime').onclick = () => cube.move('D');

    // Cube actions
    document.getElementById('btn-scramble').onclick = () => cube.scramble();
    document.getElementById('btn-reset').onclick = () => cube.reset();
    document.getElementById('btn-solve').onclick = () => {
        const cubeString = cube.getCubeState();
        solveCube(cubeString,cube);
    };
}
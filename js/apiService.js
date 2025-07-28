export async function solveCube(cubeString,cube) {
    if (!cubeString) {
        alert("Cube is busy or state is invalid. Please wait for the animation to finish.");
        return;
    }

    const endpoint = 'http://68.183.85.184:8080/solve'; // Ensure your server is running here
     const solutionDisplay = document.getElementById('solution-display');

    
    solutionDisplay.innerHTML = `<p class="text-blue-600 text-lg font-mono animate-pulse">Solving...</p>`;


    console.log("Sending cube string to backend:", cubeString);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            
            headers: { 'Content-Type': 'text/plain' },
           
            body: cubeString
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
        }

        // The response from the server is also plain text.
        const solution = await response.text();
        
        console.log("Success! Solution received:", solution);
        if (solution) {
            let result = "";
        for(let char of solution){
            if(char>='A' && char<='Z'){
                result+=char +"'";
            }else{
                result+=char.toUpperCase();
            }
        }
            solutionDisplay.innerHTML = `<p class="text-green-700 text-lg font-mono break-all">${result}</p>`;
            cube.animateSolution(solution);
        } else {
            alert("Cube is already solved!");
        }
        
        // Here you could add logic to animate the solution moves on the cube.

    } catch (error) {
        console.error("Error communicating with solver backend:", error);
        alert(`Server Might getting initialized due to inactivity please press reset and try again`);
    }
}
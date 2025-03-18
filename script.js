const apiUrl = "https://dog.ceo/api/breeds/image/random";

function resetProcessingTimes() {
    const timesList = document.getElementById("listtimes");
    timesList.innerHTML = ""; // se goleste lista
}

function displayTime(etapa, durata) {
    const listimes = document.getElementById("listtimes");
    const listitem = document.createElement("li");
    listitem.textContent = `${etapa}: ${durata.toFixed(2)} ms`;
    listtimes.appendChild(listitem);
}

function displayJSON(data) {
    const jsonDataDiv = document.getElementById("jsonData");
    jsonDataDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

//cauta element dupa id si adauga un eveniment de tip click
document.getElementById("generateimage").addEventListener("click", async () => {
    try {
        // stergem timpii de procesare anteriori
        resetProcessingTimes();

    
        const start = performance.now();  //timpul la care incepe preluarea de date
        const responseServer = await fetch(apiUrl); //asteapta raspunsul de la server
        const data = await responseServer.json(); 
        const end = performance.now();

    
        displayTime("Timp de preluare JSON", end - start);

        displayJSON(data);

    
        if (data.status !== "success") {
            alert("Probleme cu preluarea imaginii, mai incearca");
            return;
        }

        const image = new Image(); //creaza un obiect de tip imagine
        image.crossOrigin = "Anonymous";  //fara erori de securitate
        image.src = data.message; 

        //se executa cand imaginea este gata
        image.onload = () => {
            const start = performance.now();
            processImage(image, () => {
                const end = performance.now();
                displayTime("Procesare imagine", end - start);
            });
        };
    } catch (error) {
        console.error("Eroare la preluarea imaginii", error);
    }
}); 

function processImage(image, callback) {
    const canvas = document.getElementById("imageCanvas");
    const cv = canvas.getContext("2d");

    canvas.width = image.width;
    canvas.height = image.height;

                  //ox, oy
    cv.drawImage(image, 0, 0);

    //obtinem datele pixelilor
    const imageData = cv.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    let chunkNr = 0;
    const total = 4;       //rotunjire
    const chunkHeight = Math.floor(height / total);

    // variabile pentru timpul total de procesare
    let totalMirrorTime = 0;
    let totalGrayScaleTime = 0;

    function processChunk() {
        const startOY = chunkNr * chunkHeight;
        const endOY = chunkNr === total - 1 ? height : (chunkNr + 1) * chunkHeight;

        // masurare timp pentru mirror
        const startMirror = performance.now();
        for (let y = startOY; y < endOY; y++) {
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width + x) * 4;

                if (x < width / 2) {
                    // indice pixel oglindit
                    const mirrorIndex = (y * width + (width - x - 1)) * 4;

                    //are loc inversarea pixelilor
                    for (let i = 0; i < 4; i++) {
                        const temp = pixels[pixelIndex + i];
                        pixels[pixelIndex + i] = pixels[mirrorIndex + i];
                        pixels[mirrorIndex + i] = temp;
                    }
                }
            }
        }
        const endMirror = performance.now();
        totalMirrorTime += endMirror - startMirror; 

        // masurare timp pentru gray-scale
        const startGrayScale = performance.now();
        for (let y = startOY; y < endOY; y++) {
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * width + x) * 4;

                const r = pixels[pixelIndex];
                const g = pixels[pixelIndex + 1];
                const b = pixels[pixelIndex + 2];
                const gray = Math.floor((r + g + b) / 3); 

                pixels[pixelIndex] = gray;
                pixels[pixelIndex + 1] = gray;
                pixels[pixelIndex + 2] = gray;
            }
        }
        const endGrayScale = performance.now();
        totalGrayScaleTime += endGrayScale - startGrayScale; 

        chunkNr++;
        if (chunkNr < total) {
            setTimeout(processChunk, 1000); 
        } else {
            cv.putImageData(imageData, 0, 0);
            // afiseaza timpul total pentru mirror si gray-scale
            displayTime("Timp total Mirror", totalMirrorTime);
            displayTime("Timp total Gray-Scale", totalGrayScaleTime);
            if (callback) callback();
        }
    }

    processChunk();
}




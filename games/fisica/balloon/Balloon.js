document.addEventListener("DOMContentLoaded", () => {
    const balloon = document.getElementById("balloon");
    const popEffect = document.getElementById("pop-effect");
    const pumpHandle = document.getElementById("pump-handle");
    const pumpTrack = document.getElementById("pump-track");
    const btnNewBalloon = document.getElementById("new-balloon-btn");
    const btnTieKnot = document.getElementById("tie-knot-btn");
    const volumeText = document.getElementById("current-volume-text");
    const audio = document.getElementById("audio");
    const mockSound = document.getElementById("mock-sound");

    let currentVolume = 0;
    let isGameActive = true;
    let gameLoop; 
    let maxCapacity = 100; // Limite di scoppio che cambierà ogni volta
    
    // Logica Drag della pompa
    let isDragging = false;
    let startY = 0;
    let handleY = 0;
    const TRACK_HEIGHT = 120;
    
    // Meccanica di pompaggio
    let pumpState = 'bottom'; 
    let pendingAir = 0;       
    let lastProgress = 0; 

    // Tasso di sgonfiamento
    const DEFLATION_RATE = 0.08; 

    function initGame() {
        currentVolume = 0;
        pendingAir = 0;
        lastProgress = 0;
        isGameActive = true;
        handleY = TRACK_HEIGHT; // Maniglia in basso
        
        // CATTIVERIA: Imposta una capacità massima casuale tra 80 e 120
        maxCapacity = Math.floor(Math.random() * 41) + 80; 

        updatePumpVisual();
        
        balloon.style.display = "block";
        popEffect.style.display = "none";
        balloon.style.setProperty('--scale', '1');
        balloon.style.transform = `scale(1)`;
        
        volumeText.innerText = "Current volume: ?";
        volumeText.style.color = "white";
        btnNewBalloon.style.display = "none";
        btnTieKnot.style.display = "inline-block";

        cancelAnimationFrame(gameLoop);
        gameLoop = requestAnimationFrame(updateGame);
    }

    // --- GAME LOOP ---
    function updateGame() {
        if (!isGameActive) return;

        // Effetto "Secchio Bucato"
        if (currentVolume > 0) {
            currentVolume -= DEFLATION_RATE;
            if (currentVolume < 0) currentVolume = 0;
        }

        updateBalloonVisual();
        gameLoop = requestAnimationFrame(updateGame);
    }

    // --- LOGICA DELLA POMPA (DRAG) ---
    function startDrag(e) {
        if (!isGameActive) return;
        isDragging = true;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startY = clientY - handleY;
        pumpHandle.style.transition = "none"; 
    }

    function onDrag(e) {
        if (!isDragging || !isGameActive) return;
        e.preventDefault();

        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        let newY = clientY - startY;

        if (newY < 0) newY = 0;
        if (newY > TRACK_HEIGHT) newY = TRACK_HEIGHT;

        handleY = newY;
        updatePumpVisual();
        checkPumpStrokeFluid(); 
    }

    function stopDrag() {
        if (!isDragging || !isGameActive) return;
        isDragging = false;
        
        pumpHandle.style.transition = "top 0.3s ease-in";
        handleY = TRACK_HEIGHT;
        updatePumpVisual();
        
        if (pumpState === 'top') {
            pumpState = 'bottom';
        }
    }

    function updatePumpVisual() {
        pumpHandle.style.top = `${handleY}px`;
    }

    // --- LOGICA DEL GONFIAGGIO FLUIDO ---
    function checkPumpStrokeFluid() {
        const topThresh = TRACK_HEIGHT * 0.2;
        const bottomThresh = TRACK_HEIGHT * 0.8;

        if (handleY <= topThresh && pumpState === 'bottom') {
            pumpState = 'top';
            pendingAir = Math.floor(Math.random() * 10) + 12; 
            lastProgress = 0; 
        }
        
        if (pumpState === 'top') {
            if (handleY > topThresh) {
                let progress = (handleY - topThresh) / (bottomThresh - topThresh);
                if (progress > 1) progress = 1;
                
                if (progress > lastProgress) {
                    let deltaProgress = progress - lastProgress;
                    currentVolume += (pendingAir * deltaProgress);
                    lastProgress = progress;
                }
            }

            if (handleY >= bottomThresh) {
                pumpState = 'bottom';
            }
        }
    }

    function updateBalloonVisual() {
        const scale = 1 + (currentVolume / 33.33); 
        
        balloon.style.setProperty('--scale', scale);
        balloon.style.transform = `scale(${scale})`;
        
        // Ora scoppia superando la capacità segreta
        if (currentVolume > maxCapacity) {
            popBalloon();
        }
    }

    // --- FINE DEL GIOCO ---
    function popBalloon() {
        isGameActive = false;
        isDragging = false;
        cancelAnimationFrame(gameLoop); 
        
        audio.volume = 0;
        mockSound.volume = 1;
        mockSound.currentTime = 0;
        mockSound.play();
        
        balloon.style.display = "none";
        popEffect.style.display = "block";
        volumeText.innerText = "Current volume: POP! (0%)";
        volumeText.style.color = "#f44336";
        btnTieKnot.style.display = "none";
        btnNewBalloon.style.display = "inline-block";

        localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
    }

    function tieKnot() {
        if (!isGameActive) return;
        isGameActive = false;
        isDragging = false;
        cancelAnimationFrame(gameLoop); 

        // --- CATTIVERIA MATEMATICA: Ricalcola la percentuale in base al limite segreto! ---
        // Se l'aria nel palloncino è 115 e il limite segreto era 120 -> 96%
        // Se l'aria nel palloncino è 70 e il limite segreto era 80 -> 88%
        let scaledPercentage = (currentVolume / maxCapacity) * 100;
        let finalVolume = Math.round(scaledPercentage);
        
        // Imposta il volume dell'audio (normalizzato tra 0.0 e 1.0)
        let safeAudioVolume = finalVolume / 100;
        if (safeAudioVolume > 1) safeAudioVolume = 1; 
        if (safeAudioVolume < 0) safeAudioVolume = 0;
        audio.volume = safeAudioVolume;

        volumeText.innerText = `Current volume: ${finalVolume}% (Knot tied!)`;
        volumeText.style.color = "#4CAF50";
        btnTieKnot.style.display = "none";
        btnNewBalloon.style.display = "inline-block";
        btnNewBalloon.innerText = "Change Volume (New Balloon)";
    }

    // --- EVENT LISTENERS ---
    pumpHandle.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);

    pumpHandle.addEventListener("touchstart", startDrag, { passive: false });
    document.addEventListener("touchmove", onDrag, { passive: false });
    document.addEventListener("touchend", stopDrag);

    document.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            e.preventDefault(); 
            tieKnot();
        }
    });

    btnNewBalloon.addEventListener("click", initGame);
    btnTieKnot.addEventListener("click", tieKnot);

    initGame();
});
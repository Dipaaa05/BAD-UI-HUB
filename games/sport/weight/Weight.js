document.addEventListener("DOMContentLoaded", () => {
    const barbellWrapper = document.getElementById("barbell-wrapper");
    const barbell = document.getElementById("barbell");
    const crashEffect = document.getElementById("crash-effect");
    const btnNewTry = document.getElementById("new-try-btn");
    const btnLockMobile = document.getElementById("lock-btn-mobile");
    const volumeText = document.getElementById("current-volume-text");
    const audio = document.getElementById("audio");
    const mockSound = document.getElementById("mock-sound");
    const mobileTouchArea = document.getElementById("mobile-mash-area");

    let currentVolume = 0;
    let isGameActive = true;
    let hasStartedLifting = false;
    let gameLoop;

    // --- PARAMETRI DELLA FISICA CATTIVA ---
    const LIFT_POWER = 4.5; // Quanto volume aggiungi con un singolo click
    const BASE_GRAVITY = 0.15; // Gravità base (caduta lenta all'inizio)
    const GRAVITY_MULTIPLIER = 0.007; // Quanto aumenta la gravità salendo
    
    function initGame() {
        currentVolume = 0;
        isGameActive = true;
        hasStartedLifting = false;
        
        barbellWrapper.style.bottom = "0%";
        barbell.classList.remove("struggle");
        crashEffect.style.display = "none";
        
        volumeText.innerText = "Current volume: 0%";
        volumeText.style.color = "white";
        btnNewTry.style.display = "none";

        if(window.innerWidth <= 768) btnLockMobile.style.display = "inline-block";

        cancelAnimationFrame(gameLoop);
        gameLoop = requestAnimationFrame(updatePhysics);
    }

    // --- IL GAME LOOP (Secchio Bucato & Gravità) ---
    function updatePhysics() {
        if (!isGameActive) return;

        if (hasStartedLifting) {
            // CATTIVERIA: La gravità aumenta man mano che sali! 
            // A 100% di volume la gravità sarà BASE_GRAVITY + (100 * 0.007) = Molto pesante!
            let currentGravity = BASE_GRAVITY + (currentVolume * GRAVITY_MULTIPLIER);
            
            currentVolume -= currentGravity;

            // Tremolio di sforzo se superi il 70%
            if (currentVolume > 70) {
                barbell.classList.add("struggle");
            } else {
                barbell.classList.remove("struggle");
            }

            // Se il bilanciere tocca il pavimento dopo essere stato sollevato... CRASH!
            if (currentVolume <= 0) {
                currentVolume = 0;
                dropBarbell();
                return; // Ferma il loop
            }
        }

        updateVisuals();
        gameLoop = requestAnimationFrame(updatePhysics);
    }

    function updateVisuals() {
        // Limita visivamente al 100% anche se si smasha fortissimo
        let visualVolume = currentVolume > 100 ? 100 : currentVolume;
        barbellWrapper.style.bottom = `${visualVolume}%`;
        
        if (hasStartedLifting && isGameActive) {
            volumeText.innerText = `Lifting... ${Math.round(visualVolume)}%`;
        }
    }

    // --- LOGICA DI SOLLEVAMENTO ---
    function lift() {
        if (!isGameActive) return;
        
        hasStartedLifting = true;
        currentVolume += LIFT_POWER;
        
        // Un piccolo limite superiore per non spaccare la variabile se l'utente usa un autoclicker
        if (currentVolume > 110) currentVolume = 110; 
    }

    // --- FINE GIOCO: FALLIMENTO ---
    function dropBarbell() {
        isGameActive = false;
        cancelAnimationFrame(gameLoop);
        
        barbell.classList.remove("struggle");
        barbellWrapper.style.bottom = "0%"; // Schianto a terra
        
        // Punizione Audio
        audio.volume = 0;
        mockSound.volume = 1;
        mockSound.currentTime = 0;
        mockSound.play();
        
        crashEffect.style.display = "block";
        volumeText.innerText = "Volume: 0% (IT FELL!)";
        volumeText.style.color = "#f44336";
        
        btnNewTry.style.display = "inline-block";
        if(window.innerWidth <= 768) btnLockMobile.style.display = "none";

        localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
    }

    // --- FINE GIOCO: VITTORIA/LOCK ---
    function lockVolume() {
        if (!isGameActive || !hasStartedLifting) return;
        isGameActive = false;
        cancelAnimationFrame(gameLoop);

        barbell.classList.remove("struggle");
        
        let finalVolume = Math.round(currentVolume > 100 ? 100 : currentVolume);
        
        // Setta l'audio
        audio.volume = finalVolume / 100;

        volumeText.innerText = `Volume Locked at: ${finalVolume}%!`;
        volumeText.style.color = "#4CAF50";
        
        btnNewTry.style.display = "inline-block";
        btnNewTry.innerText = "New Try (New Volume)";
        if(window.innerWidth <= 768) btnLockMobile.style.display = "none";
    }

    // --- EVENT LISTENERS ---
    
    // Tastiera: Spazio per alzare, Invio per bloccare
    document.addEventListener("keydown", (e) => {
        if (!isGameActive) return;

        if (e.code === "Space") {
            e.preventDefault(); // Previene lo scroll della pagina
            
            // CATTIVERIA ASSOLUTA: Ignora gli input se l'utente tiene premuto il tasto. Deve SMASHARE!
            if (e.repeat) return; 
            
            lift();
        }

        if (e.code === "Enter") {
            e.preventDefault();
            lockVolume();
        }
    });

    // Supporto Mobile / Click del Mouse sull'area
    mobileTouchArea.addEventListener("mousedown", lift);
    mobileTouchArea.addEventListener("touchstart", (e) => {
        e.preventDefault(); // Previene zoom o scroll accidentali
        lift();
    }, { passive: false });

    // Bottone Lock per mobile
    btnLockMobile.addEventListener("click", lockVolume);
    btnLockMobile.addEventListener("touchstart", (e) => {
        e.preventDefault();
        lockVolume();
    }, { passive: false });

    btnNewTry.addEventListener("click", initGame);

    initGame();
});
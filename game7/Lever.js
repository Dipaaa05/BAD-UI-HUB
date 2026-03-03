window.onload = function() {
    const audio = document.getElementById('audio');
    const mockSound = document.getElementById('mock-sound');
    const valueDisplay = document.getElementById('value');
    
    const leverBar = document.getElementById('lever-bar');
    const leverKnob = document.getElementById('lever-knob');

    // Variabili fisiche
    let currentVolume = 50; // Inizia al 50% (al centro)
    let velocity = 0;
    let angle = 0; // Inclinazione della barra in gradi
    let isFallen = false;

    audio.volume = currentVolume / 100;

    // --- CALCOLO INCLINAZIONE (Mouse & Touch) ---
    // Spostare il cursore a sinistra/destra dello schermo inclinerà la barra
    function updateAngle(clientX) {
        if (isFallen) return;
        
        // Trova il centro dello schermo
        const centerX = window.innerWidth / 2;
        // Calcola la distanza dal centro (da -1 a 1)
        let normalizedX = (clientX - centerX) / (window.innerWidth / 2);
        
        // Limita l'inclinazione massima a 30 gradi
        angle = normalizedX * 30; 
        leverBar.style.transform = `rotate(${angle}deg)`;
        
        if (audio.paused) audio.play().catch(() => {});
    }

    // Eventi PC
    document.addEventListener('mousemove', (e) => updateAngle(e.clientX));
    
    // Eventi Smartphone
    document.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Evita lo scroll accidentale
        updateAngle(e.touches[0].clientX);
    }, { passive: false });


    // --- IL MOTORE FISICO (Gira a 60 FPS) ---
    function physicsLoop() {
        if (!isFallen) {
            // 1. GRAVITÀ: L'accelerazione dipende dall'angolo (seno dell'angolo)
            // Più è inclinata, più accelera velocemente!
            let acceleration = Math.sin(angle * Math.PI / 180) * 0.4;
            velocity += acceleration;

            // 2. ATTRITO: Pochissimo attrito (0.97) per renderla "scivolosa"
            velocity *= 0.97; 

            // 3. POSIZIONE: Aggiorna la posizione (currentVolume mappa perfettamente da 0 a 100%)
            currentVolume += velocity;

            // 4. CONTROLLO CADUTA: Se supera i bordi (0 o 100), cade!
            if (currentVolume < -2 || currentVolume > 102) {
                triggerFall();
            } else {
                // Aggiorna la grafica finché è sulla barra
                // Limitiamo la visualizzazione tra 0 e 100 per il testo
                let displayVol = Math.max(0, Math.min(100, currentVolume));
                
                leverKnob.style.left = `${currentVolume}%`;
                audio.volume = displayVol / 100;
                valueDisplay.textContent = `Volume: ${Math.round(displayVol)}%`;
            }
        }

        requestAnimationFrame(physicsLoop); // Richiama il frame successivo
    }

    // --- ANIMAZIONE DELLA CADUTA ---
    function triggerFall() {
        isFallen = true;
        
        // Suono di sconfitta
        mockSound.volume = 1;
        mockSound.currentTime = 0;
        mockSound.play();
        // Aggiorna il contatore dei fallimenti nel LocalStorage
        localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
        
        // Volume a zero!
        audio.volume = 0;
        valueDisplay.textContent = "Volume: 0% (You fell!)";
        valueDisplay.style.color = "#f44336";

        // Animazione CSS per far cadere la pallina nel vuoto
        leverKnob.style.top = "150px"; 
        leverKnob.style.opacity = "0";

        // Ricrea la pallina dopo 2 secondi per riprovare
        setTimeout(() => {
            currentVolume = 50;
            velocity = 0;
            angle = 0;
            leverBar.style.transform = `rotate(0deg)`;
            
            // Resetta lo stile del cursore
            leverKnob.style.top = "auto";
            leverKnob.style.bottom = "12px";
            leverKnob.style.left = "50%";
            leverKnob.style.opacity = "1";
            
            valueDisplay.style.color = "white";
            valueDisplay.textContent = "Volume: 50%";
            
            isFallen = false;
        }, 2000);
    }

    // Avvia la simulazione fisica
    requestAnimationFrame(physicsLoop);
}
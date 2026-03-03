window.onload = function() {
    const audio = document.getElementById('audio');
    const valueDisplay = document.getElementById('value');
    const thumb = document.getElementById('patience-thumb');
    const fill = document.getElementById('patience-fill');

    let currentVolume = 0; // Il volume usa i decimali per maggiore frustrazione
    let isDragging = false;
    let lastMouseX = 0;
    
    audio.volume = 0;

    // --- AGGIORNA INTERFACCIA E AUDIO ---
    function updateUI() {
        // Limita il volume strettamente tra 0 e 100
        if (currentVolume < 0) currentVolume = 0;
        if (currentVolume > 100) currentVolume = 100;

        audio.volume = currentVolume / 100;
        
        // Mostra 4 cifre decimali per dare l'illusione del progresso
        valueDisplay.textContent = `Volume: ${currentVolume.toFixed(4)}%`;

        fill.style.width = currentVolume + '%';
        thumb.style.left = currentVolume + '%';
    }

    // --- FUNZIONE CONDIVISA PER IL MOVIMENTO ---
    function handleMove(clientX) {
        if (!isDragging) return;

        const deltaX = clientX - lastMouseX;
        lastMouseX = clientX;

        // LA TORTURA ASIMMETRICA:
        if (deltaX > 0) {
            // Verso destra: lentissimo e faticoso
            currentVolume += deltaX * 0.0015; 
        } else if (deltaX < 0) {
            // Verso sinistra: errore fatale, perdi il 1000% più in fretta
            currentVolume += deltaX * 0.015;  
        }

        updateUI();
    }

    // ==========================================
    // CONTROLLI MOUSE (PC)
    // ==========================================
    thumb.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Risolve il bug del "Ghost Drag"
        isDragging = true;
        lastMouseX = e.clientX;
        
        // Avvia l'audio al primo click se bloccato dal browser
        if (audio.paused) audio.play().catch(() => {});
    });

    document.addEventListener('mousemove', (e) => {
        handleMove(e.clientX);
    });

    document.addEventListener('mouseup', () => { 
        isDragging = false; 
    });


    // ==========================================
    // CONTROLLI TOUCH (SMARTPHONE)
    // ==========================================
    thumb.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Blocca lo scroll o lo zoom accidentale
        isDragging = true;
        lastMouseX = e.touches[0].clientX; // Prende la coordinata del primo dito
        
        if (audio.paused) audio.play().catch(() => {});
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault(); // Impedisce la navigazione "Avanti/Indietro" con lo swipe
        handleMove(e.touches[0].clientX);
    }, { passive: false });

    document.addEventListener('touchend', () => { 
        isDragging = false; 
    });
    
    document.addEventListener('touchcancel', () => { 
        isDragging = false; 
    });


    // ==========================================
    // LA REGRESSIONE INESORABILE
    // ==========================================
    // Questo timer gira 100 volte al secondo
    setInterval(() => {
        // Se non stai toccando/cliccando il cursore, il volume scende da solo
        if (!isDragging && currentVolume > 0) {
            currentVolume -= 0.002; 
            updateUI();
        }
    }, 10);
}
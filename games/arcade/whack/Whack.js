window.onload = function() {
    const volumeSlider = document.getElementById('volume');
    const audio = document.getElementById('audio');
    const mockSound = document.getElementById('mock-sound');
    const valueDisplay = document.getElementById('value');
    const gameArea = document.getElementById('game-area');

    let currentVolume = 0;
    let leakTimeout;
    let leakInterval;
    let spawnTimer;

    audio.volume = 0;

    // --- FORMULE DI DIFFICOLTÀ SCALABILE (Ora molto più magnanime) ---
    
    // PERIODO DI GRAZIA: Prima ti dava pochissimo, ora ti dà dai 3 secondi 
    // di pausa (quando sei a 0% volume) fino a 1 secondo intero (anche a 100% volume).
    function getGracePeriod() { return Math.max(1000, 3000 - (currentVolume * 20)); }
    
    // VELOCITÀ DI PERDITA: Prima perdevi 1% ogni decimo di secondo.
    // Ora perdi 1% ogni 1.5 secondi all'inizio, e al massimo 1% ogni mezzo secondo (500ms) alla fine.
    function getLeakSpeed() { return Math.max(500, 1500 - (currentVolume * 10)); }
    
    // Cadenza di comparsa (I bottoni continuano a spuntare veloci per farti confondere)
    function getSpawnDelay() { return Math.max(280, 1000 - (currentVolume * 7.2)); }
    
    // Durata del bottone a schermo prima di scomparire da solo
    function getLifespan() { return Math.max(500, 1800 - (currentVolume * 13)); }
    
    // Probabilità che spunti un bottone ROSSO (trappola)
    function getRedProb() { return 0.05 + (currentVolume * 0.003); }

    function updateVolume() {
        volumeSlider.value = currentVolume;
        audio.volume = currentVolume / 100;
        valueDisplay.textContent = `Volume: ${currentVolume}%`;
    }

    // --- SECCHIO BUCATO DINAMICO ---
    function startLeaking() {
        clearInterval(leakInterval);
        leakInterval = setInterval(() => {
            if (currentVolume > 0) {
                currentVolume--;
                updateVolume();
            }
        }, getLeakSpeed());
    }

    function resetLeakTimer() {
        clearInterval(leakInterval);
        clearTimeout(leakTimeout);
        leakTimeout = setTimeout(startLeaking, getGracePeriod()); 
    }

    // --- GENERATORE DI BOTTONI ---
    function spawnButton() {
        const btn = document.createElement('button');
        
        const isGreen = Math.random() > getRedProb();
        btn.className = `spawn-btn ${isGreen ? 'mole-btn' : 'bomb-btn'}`;
        btn.textContent = isGreen ? '+1' : 'RESET';

        const minSize = Math.max(30, 60 - (currentVolume * 0.3));
        const maxSize = Math.max(60, 110 - (currentVolume * 0.5));
        const size = Math.floor(Math.random() * (maxSize - minSize)) + minSize;
        
        btn.style.width = `${size}px`;
        btn.style.height = `${size}px`;
        btn.style.fontSize = `${size / 3.5}px`; 

        // Usiamo le dimensioni reali del box di gioco anziché quelle dello schermo
        const maxX = gameArea.clientWidth - size;
        const maxY = gameArea.clientHeight - size;
        btn.style.left = `${Math.floor(Math.random() * maxX)}px`;
        btn.style.top = `${Math.floor(Math.random() * maxY)}px`;

        btn.addEventListener('click', function(e) {
            if (audio.paused) audio.play().catch(() => {});
            
            if (isGreen) {
                if (currentVolume < 100) {
                    currentVolume++;
                    updateVolume();
                }
                resetLeakTimer();
            } else {
                currentVolume = 0;
                updateVolume();
                mockSound.volume = 1;
                mockSound.currentTime = 0;
                mockSound.play();
                // Aggiorna il contatore dei fallimenti nel LocalStorage
                localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
                resetLeakTimer();
            }
            btn.remove();
        });

        gameArea.appendChild(btn);

        setTimeout(() => {
            if (btn.parentElement) btn.remove();
        }, getLifespan());
    }

    // --- LOOP DI SPAWN DINAMICO ---
    function spawnLoop() {
        spawnButton();
        clearTimeout(spawnTimer);
        spawnTimer = setTimeout(spawnLoop, getSpawnDelay());
    }

    // Avvia tutto
    resetLeakTimer();
    spawnLoop();
}
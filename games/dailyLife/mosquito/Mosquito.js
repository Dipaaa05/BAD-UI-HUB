window.onload = function() {
    const audio = document.getElementById('audio');
    const mockSound = document.getElementById('mock-sound');
    const buzzSound = document.getElementById('buzz-sound');
    const valueDisplay = document.getElementById('value');
    const bodyArea = document.getElementById('body-area');
    
    const mosquito = document.getElementById('mosquito-thumb');
    const mosquitoArea = document.getElementById('mosquito-area');

    let currentVolume = 0;
    audio.volume = 0;
    let isSquashed = false;

    // Coordinate iniziali della zanzara (al centro dell'area di gioco)
    let mX = mosquitoArea.clientWidth / 2;
    let mY = mosquitoArea.clientHeight / 2;
    
    // Tracciamento del mouse per calcolare la velocità
    let lastMouseX = mosquitoArea.clientWidth / 2;
    let lastMouseY = mosquitoArea.clientHeight / 2;

    // Difficoltà bilanciata
    const EVASION_RADIUS = 60; 
    const SAFE_SPEED = 3.5; 

    function updateMosquito() {
        if (isSquashed) return;

        // Calcoliamo i limiti massimi considerando la larghezza della zanzara stessa
        let maxX = mosquitoArea.clientWidth - mosquito.offsetWidth;
        let maxY = mosquitoArea.clientHeight - mosquito.offsetHeight;

        // EFFETTO PAC-MAN modificato per i bordi del box
        if (mX > maxX) mX = 0;
        if (mX < 0) mX = maxX;
        if (mY > maxY) mY = 0;
        if (mY < 0) mY = maxY;
        
        mosquito.style.left = mX + 'px';
        mosquito.style.top = mY + 'px';
    }

    function scareMosquito(multiplier = 1) {
        // Semplice movimento di scatto casuale per spaventare la zanzara
        mX += (Math.random() - 0.5) * 200 * multiplier;
        mY += (Math.random() - 0.5) * 200 * multiplier;
        updateMosquito();
    }

    // Logica per far scappare la zanzara in base alla velocità del mouse
    document.addEventListener('mousemove', function(e) {
        if (isSquashed) return;

        // Calcola la velocità del mouse
        let speedX = e.clientX - lastMouseX;
        let speedY = e.clientY - lastMouseY;
        let mouseSpeed = Math.sqrt(speedX * speedX + speedY * speedY);
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        // Ottieni la posizione reale della zanzara rispetto allo schermo
        let rect = mosquito.getBoundingClientRect();
        let mosqCenterX = rect.left + rect.width / 2;
        let mosqCenterY = rect.top + rect.height / 2;

        let distX = e.clientX - mosqCenterX;
        let distY = e.clientY - mosqCenterY;
        let distance = Math.sqrt(distX * distX + distY * distY);

        if (distance < EVASION_RADIUS) {
            if (mouseSpeed > SAFE_SPEED) {
                // Spaventa la zanzara spingendola via
                mX -= (distX / distance) * 50;
                mY -= (distY / distance) * 50;
                updateMosquito();
            }
        }
    });

    // Evento: Zanzara Schiacciata
    function squashEvent(e) {
        e.stopPropagation(); // BLOCCA IL CLICK QUI, NON ARRIVA AL BODY!

        if (isSquashed) return;
        isSquashed = true;

        let maxX = mosquitoArea.clientWidth - mosquito.offsetWidth;
        
        // Calcola la percentuale in base ai bordi reali del box
        let percentage = (mX / maxX) * 100;
        
        // Per evitare numeri strani come 101% o -1% dovuti agli arrotondamenti
        percentage = Math.max(0, Math.min(100, percentage));

        currentVolume = Math.round(percentage);
        
        audio.volume = currentVolume / 100;
        valueDisplay.textContent = `Volume: ${currentVolume}%`;
        valueDisplay.style.color = "#4CAF50";

        mosquito.style.backgroundColor = "red"; 
        mosquito.style.transform = "scale(2)";
        mosquito.style.opacity = "0";
        buzzSound.pause();

        setTimeout(() => {
            isSquashed = false;
            mosquito.style.backgroundColor = "#3e2723";
            mosquito.style.transform = "scale(1)";
            mosquito.style.opacity = "1";
            scareMosquito(2); 
            buzzSound.play();
            valueDisplay.style.color = "white";
        }, 2000);
    }

    mosquito.addEventListener('mousedown', squashEvent);
    mosquito.addEventListener('touchstart', squashEvent);

    // --- PUNIZIONE PER CHI CLICCA A VUOTO (MISS) ---
    function missedClick() {
        if (currentVolume > 0) {
            currentVolume = 0;
            audio.volume = 0;
            valueDisplay.textContent = `Volume: 0% (You missed!)`;
            valueDisplay.style.color = "#f44336";
            
            mockSound.volume = 1;
            mockSound.play();
        }
        scareMosquito(1.5);
    }

    // Colleghiamo la punizione allo sfondo
    bodyArea.addEventListener('mousedown', missedClick);
    bodyArea.addEventListener('touchstart', missedClick);
    
    // Avvia l'aggiornamento costante della posizione (effetto fluido)
    setInterval(updateMosquito, 20);

    // Inizializza l'audio al primissimo click dell'utente nella pagina (policy dei browser)
    bodyArea.addEventListener('click', function() {
        if (audio.paused) audio.play();
        if (buzzSound.paused) buzzSound.play();
    }, { once: true });
};
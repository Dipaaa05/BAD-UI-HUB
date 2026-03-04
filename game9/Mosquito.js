window.onload = function() {
    const audio = document.getElementById('audio');
    const mockSound = document.getElementById('mock-sound');
    const buzzSound = document.getElementById('buzz-sound');
    const valueDisplay = document.getElementById('value');
    const bodyArea = document.getElementById('body-area');
    
    const mosquito = document.getElementById('mosquito-thumb');

    let currentVolume = 0;
    audio.volume = 0;
    let isSquashed = false;

    // Mosquito Coordinates
    let mX = window.innerWidth * 0.1;
    let mY = window.innerHeight * 0.5;
    
    // Tracking mouse to calculate speed
    let lastMouseX = window.innerWidth / 2;
    let lastMouseY = window.innerHeight / 2;

    const EVASION_RADIUS = 120; 
    const SAFE_SPEED = 2.5; 

    function updateMosquito() {
        if (isSquashed) return;

        // 1. EFFETTO PAC-MAN: Se esce dallo schermo, riappare dall'altra parte
        if (mX > window.innerWidth) mX = 0;
        if (mX < 0) mX = window.innerWidth;
        if (mY > window.innerHeight) mY = 0;
        if (mY < 0) mY = window.innerHeight;
        
        mosquito.style.left = mX + 'px';
        mosquito.style.top = mY + 'px';
    }

    // 3. MOVIMENTO PERPETUO: La zanzara non sta mai ferma
    setInterval(() => {
        if (!isSquashed) {
            mX += (Math.random() - 0.5) * 15; // Tremolio casuale
            mY += (Math.random() - 0.5) * 15;
            updateMosquito();
        }
    }, 100);

    function scareMosquito(intensity = 1) {
        if (isSquashed) return;
        mX += (Math.random() - 0.5) * 500 * intensity;
        mY += (Math.random() - 0.5) * 500 * intensity;
        updateMosquito();

        buzzSound.volume = 1;
        setTimeout(() => { buzzSound.volume = 0.2; }, 500);
    }

    // --- EVASION MECHANIC ---
    function handleMove(clientX, clientY) {
        if (audio.paused) audio.play().catch(() => {});
        if (buzzSound.paused) { buzzSound.volume = 0.2; buzzSound.play().catch(() => {}); }

        let speed = Math.sqrt(Math.pow(clientX - lastMouseX, 2) + Math.pow(clientY - lastMouseY, 2));
        lastMouseX = clientX;
        lastMouseY = clientY;

        let distX = mX - clientX;
        let distY = mY - clientY;
        let distance = Math.sqrt(distX*distX + distY*distY);

        if (distance < EVASION_RADIUS && speed > SAFE_SPEED) {
            let escapeX = (distX / distance) * 180;
            let escapeY = (distY / distance) * 180;
            
            mX += escapeX + (Math.random() - 0.5) * 50; 
            mY += escapeY + (Math.random() - 0.5) * 50;
            
            updateMosquito();
            buzzSound.volume = 0.8; 
        } else {
            buzzSound.volume = 0.2; 
        }
    }

    document.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    document.addEventListener('touchmove', (e) => {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    // --- SQUASHING THE MOSQUITO ---
    mosquito.addEventListener('mousedown', (e) => {
        e.stopPropagation(); 
        trySquash(e.clientX, e.clientY);
    });

    mosquito.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        trySquash(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    function trySquash(clientX, clientY) {
        // 2. IL SESTO SENSO: Calcola se l'utente è "apparso dal nulla" (Tap diretto su mobile)
        let tapDistance = Math.sqrt(Math.pow(clientX - lastMouseX, 2) + Math.pow(clientY - lastMouseY, 2));
        
        // Se la distanza dal lastMouseX è troppo grande, è un "Tap" e non un trascinamento!
        if (tapDistance > 30) {
            scareMosquito(2);
            missedClick(); // Lo puniamo come se avesse mancato
            return;
        }

        isSquashed = true;
        let percentage = (mX / window.innerWidth) * 100;
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

    // --- PUNISHMENT FOR SPAM CLICKING ---
    bodyArea.addEventListener('mousedown', missedClick);
    bodyArea.addEventListener('touchstart', missedClick);

    function missedClick() {
        if (currentVolume > 0) {
            currentVolume = 0;
            audio.volume = 0;
            valueDisplay.textContent = `Volume: 0% (You missed!)`;
            valueDisplay.style.color = "#f44336";
            
            mockSound.volume = 1;
            mockSound.currentTime = 0;
            mockSound.play();
            localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
        }
        scareMosquito(1.5);
    }
}
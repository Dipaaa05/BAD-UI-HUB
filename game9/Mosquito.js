window.onload = function() {
    const audio = document.getElementById('audio');
    const mockSound = document.getElementById('mock-sound');
    const buzzSound = document.getElementById('buzz-sound');
    const valueDisplay = document.getElementById('value');
    const bodyArea = document.getElementById('body-area');
    
    const mosquito = document.getElementById('mosquito-thumb');

    let currentVolume = 0;
    audio.volume = 0;

    // Mosquito Coordinates
    let mX = window.innerWidth * 0.1;
    let mY = window.innerHeight * 0.5;
    
    // Tracking mouse to calculate speed
    let lastMouseX = window.innerWidth / 2;
    let lastMouseY = window.innerHeight / 2;

    const EVASION_RADIUS = 120; // If you are in this radius, it watches you
    const SAFE_SPEED = 2.5; // MAXIMUM tolerated mouse speed (VERY SLOW)

    function updateMosquito() {
        // Confine the mosquito to the screen
        mX = Math.max(20, Math.min(window.innerWidth - 20, mX));
        mY = Math.max(20, Math.min(window.innerHeight - 20, mY));
        
        mosquito.style.left = mX + 'px';
        mosquito.style.top = mY + 'px';
    }

    updateMosquito();

    function scareMosquito(intensity = 1) {
        // Escapes in a random direction with force
        mX += (Math.random() - 0.5) * 400 * intensity;
        mY += (Math.random() - 0.5) * 400 * intensity;
        updateMosquito();

        // Turns up the buzz volume to annoy you
        buzzSound.volume = 1;
        setTimeout(() => { buzzSound.volume = 0.2; }, 500);
    }

    // --- EVASION MECHANIC (Mouse & Touch) ---
    function handleMove(clientX, clientY) {
        if (audio.paused) audio.play().catch(() => {});
        if (buzzSound.paused) { buzzSound.volume = 0.2; buzzSound.play().catch(() => {}); }

        // Calculate mouse speed
        let speed = Math.sqrt(Math.pow(clientX - lastMouseX, 2) + Math.pow(clientY - lastMouseY, 2));
        lastMouseX = clientX;
        lastMouseY = clientY;

        // Calculate distance from mosquito
        let distX = mX - clientX;
        let distY = mY - clientY;
        let distance = Math.sqrt(distX*distX + distY*distY);

        // If you are close AND move too fast... IT FLIES AWAY!
        if (distance < EVASION_RADIUS && speed > SAFE_SPEED) {
            // Calculate escape vector (opposite to mouse)
            let escapeX = (distX / distance) * 150;
            let escapeY = (distY / distance) * 150;
            
            mX += escapeX + (Math.random() - 0.5) * 50; 
            mY += escapeY + (Math.random() - 0.5) * 50;
            
            updateMosquito();
            buzzSound.volume = 0.8; // Loud buzz when escaping
        } else {
            buzzSound.volume = 0.2; // Quiet buzz if you stay still
        }
    }

    document.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    
    document.addEventListener('touchmove', (e) => {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    // --- SQUASHING THE MOSQUITO ---
    mosquito.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // Prevent background click from firing
        squashMosquito();
    });

    mosquito.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        squashMosquito();
    }, { passive: false });

    function squashMosquito() {
        // Calculate volume percentage based on where the mosquito is on screen!
        let percentage = (mX / window.innerWidth) * 100;
        currentVolume = Math.round(percentage);
        
        audio.volume = currentVolume / 100;
        valueDisplay.textContent = `Volume: ${currentVolume}%`;
        valueDisplay.style.color = "#4CAF50";

        // Pause it and hide it for 2 seconds as a "reward"
        mosquito.style.backgroundColor = "red"; // Splat!
        mosquito.style.transform = "scale(2)";
        mosquito.style.opacity = "0";
        buzzSound.pause();

        setTimeout(() => {
            mosquito.style.backgroundColor = "#3e2723";
            mosquito.style.transform = "scale(1)";
            mosquito.style.opacity = "1";
            scareMosquito(2); // Respawns far away
            buzzSound.play();
            valueDisplay.style.color = "white";
        }, 2000);
    }

    // --- PUNISHMENT FOR SPAM CLICKING ---
    // If you click empty space on the screen trying to catch it...
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
            // Aggiorna il contatore dei fallimenti nel LocalStorage
            localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
        }
        // The mosquito teleports away laughing at you
        scareMosquito(1.5);
    }
}
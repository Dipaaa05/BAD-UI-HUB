window.onload = function() {
    const volumeSlider = document.getElementById('volume');
    const audio = document.getElementById('audio');
    const mockSound = document.getElementById('mock-sound');
    const valueDisplay = document.getElementById('value');
    
    const actionBtn = document.getElementById('action-btn');
    const powerFill = document.getElementById('power-fill');
    const projectile = document.getElementById('projectile');

    let currentVolume = 0;
    let power = 0;
    let powerDirection = 1;
    let powerInterval;
    let isCharging = false;
    let isFlying = false;

    audio.volume = 0;

    // --- LOGICA DELLA BARRA DI POTENZA ---
    function startCharging() {
        if (isFlying) return; // Non può lanciare mentre c'è già un proiettile in volo
        
        if (audio.paused) audio.play().catch(() => {});
        
        isCharging = true;
        power = 0;
        projectile.style.display = 'none';

        // Velocità estrema della barra (ping-pong ogni 15ms)
        powerInterval = setInterval(() => {
            power += 4 * powerDirection; // Aumenta/diminuisce di 4 a ogni frame
            if (power >= 100) {
                power = 100;
                powerDirection = -1;
            } else if (power <= 0) {
                power = 0;
                powerDirection = 1;
            }
            powerFill.style.width = power + '%';
        }, 15);
    }

    function stopCharging() {
        if (!isCharging) return;
        isCharging = false;
        clearInterval(powerInterval);
        
        throwProjectile(power);
    }

    // --- LOGICA DEL LANCIO E FISICA ---
    function throwProjectile(finalPower) {
        isFlying = true;
        projectile.style.display = 'block';
        
        // La barra intera è lunga 300px. 
        // Vogliamo che a 100% di potenza, il lancio arrivi a 360px (Fuori campo!)
        const maxDistance = 360; 
        const targetX = (finalPower / 100) * maxDistance;
        
        let startTime = null;
        const flightDuration = 800; // Il lancio dura 800ms

        function animateFlight(currentTime) {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            
            // Variabile 't' va da 0.0 a 1.0 (inizio e fine volo)
            let t = Math.min(elapsed / flightDuration, 1);
            
            // X è lineare: va da 0 al targetX
            let currentX = t * targetX;
            
            // Y usa una sinusoide per simulare la parabola (va su e poi giù)
            // L'altezza massima dipende dalla potenza
            let maxHeight = 100 + (finalPower * 0.5); 
            let currentY = Math.sin(t * Math.PI) * maxHeight;

            projectile.style.left = `${currentX}px`;
            projectile.style.bottom = `${currentY}px`;

            if (t < 1) {
                requestAnimationFrame(animateFlight);
            } else {
                // IL VOLO È FINITO! Calcoliamo dove è atterrato.
                evaluateLanding(currentX);
            }
        }

        requestAnimationFrame(animateFlight);
    }

    // --- VALUTAZIONE DELL'ATTERRAGGIO ---
    function evaluateLanding(landingX) {
        isFlying = false;
        
        // La barra del volume è larga 300px.
        if (landingX > 300) {
            // FUORICAMPO! Ha sballato.
            currentVolume = 0;
            mockSound.volume = 1;
            mockSound.currentTime = 0;
            mockSound.play();
            // Aggiorna il contatore dei fallimenti nel LocalStorage
            localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
            valueDisplay.textContent = "Volume: 0% (Out of range!)";
            valueDisplay.style.color = "red";
        } else {
            // Atterrato sulla barra! Calcoliamo la percentuale (da 0 a 300)
            currentVolume = Math.round((landingX / 300) * 100);
            valueDisplay.textContent = `Volume: ${currentVolume}%`;
            valueDisplay.style.color = "white";
        }

        volumeSlider.value = currentVolume;
        audio.volume = currentVolume / 100;
    }

    // --- EVENTI DEL MOUSE (PC) ---
    actionBtn.addEventListener('mousedown', startCharging);
    actionBtn.addEventListener('mouseup', stopCharging);
    actionBtn.addEventListener('mouseleave', () => {
        if (isCharging) stopCharging();
    });

    // --- EVENTI TOUCH (SMARTPHONE) ---
    actionBtn.addEventListener('touchstart', (e) => { 
        // Impedisce il doppio-tap per zoomare o l'evidenziazione del bottone
        e.preventDefault(); 
        startCharging(); 
    }, { passive: false });

    actionBtn.addEventListener('touchend', (e) => { 
        e.preventDefault(); 
        stopCharging(); 
    });

    actionBtn.addEventListener('touchcancel', (e) => { 
        // Se il telefono interrompe il tocco (es. arriva una notifica)
        if (isCharging) stopCharging(); 
    });
}
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
        projectile.style.display = 'block';
        projectile.style.left = '10px';
        projectile.style.bottom = '0px';

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
        if (!isCharging || isFlying) return;
        isCharging = false;
        isFlying = true;
        clearInterval(powerInterval);

        // --- FISICA DEL LANCIO ---
        // Il moltiplicatore 0.65 assicura che con power=100 si superi lo slider (circa 400px di distanza)
        let velocity = power * 0.65; 
        let angle = Math.PI / 4; // 45 gradi per la parabola perfetta
        let gravity = 9.8;
        let time = 0;

        let flyInterval = setInterval(() => {
            time += 0.2; // Velocità dello scorrere del tempo nell'animazione
            let x = velocity * Math.cos(angle) * time;
            let y = (velocity * Math.sin(angle) * time) - (0.5 * gravity * time * time);

            if (y <= 0 && time > 0.5) {
                // IL PROIETTILE TOCCA TERRA
                clearInterval(flyInterval);
                isFlying = false;
                
                let landingX = Math.round(x);
                projectile.style.bottom = '0px';

                // --- NUOVA LOGICA: DUE ZONE FUORI CAMPO (Prima di 40px e dopo 340px) ---
                if (landingX < 40 || landingX > 340) {
                    currentVolume = 0;
                    mockSound.volume = 1;
                    mockSound.currentTime = 0;
                    mockSound.play().catch(()=>{});
                    
                    // Aggiorna il contatore dei fallimenti nel LocalStorage
                    localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
                    
                    valueDisplay.textContent = landingX < 40 ? "Volume: 0% (Too weak!)" : "Volume: 0% (Too strong!)";
                    valueDisplay.style.color = "#f44336";
                } else {
                    // Atterrato SULLA barra! (Calcoliamo la percentuale togliendo i 40px di "vuoto" iniziale)
                    currentVolume = Math.round(((landingX - 40) / 300) * 100);
                    
                    // Sicurezza extra per non avere volumi oltre 100 o sotto 0
                    if (currentVolume > 100) currentVolume = 100;
                    if (currentVolume < 0) currentVolume = 0;

                    valueDisplay.textContent = `Volume: ${currentVolume}%`;
                    valueDisplay.style.color = "white";
                }

                volumeSlider.value = currentVolume;
                audio.volume = currentVolume / 100;
            } else {
                // Aggiorna la posizione in volo visivamente
                // Il "+ 10" serve perché il proiettile parte fisicamente da left: 10px
                projectile.style.left = `${10 + x}px`;
                projectile.style.bottom = `${y}px`;
            }
        }, 20); // Aggiorna ogni 20ms (circa 50 FPS)
    }

    // --- EVENTI DEL MOUSE (PC) ---
    actionBtn.addEventListener('mousedown', startCharging);
    actionBtn.addEventListener('mouseup', stopCharging);
    actionBtn.addEventListener('mouseleave', () => {
        if (isCharging) stopCharging();
    });

    // --- EVENTI TOUCH (SMARTPHONE) ---
    actionBtn.addEventListener('touchstart', (e) => { 
        // Impedisce il doppio-tap per zoomare o l'evidenziazione del bottone su mobile
        e.preventDefault(); 
        startCharging(); 
    }, { passive: false });

    actionBtn.addEventListener('touchend', (e) => { 
        e.preventDefault(); 
        stopCharging(); 
    });
}
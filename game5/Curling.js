window.onload = function() {
    const volumeSlider = document.getElementById('volume');
    const audio = document.getElementById('audio');
    const mockSound = document.getElementById('mock-sound');
    const valueDisplay = document.getElementById('value');
    
    const launchBtn = document.getElementById('launch-btn');
    const sweepBtn = document.getElementById('sweep-btn');
    const stone = document.getElementById('stone');
    const iceTrack = document.getElementById('ice-track');

    let currentVolume = 0;
    let position = 10; // Posizione iniziale (left)
    let velocity = 0;
    let isMoving = false;
    let animationFrame;

    audio.volume = 0;

    function updateVolume(vol) {
        currentVolume = Math.min(Math.max(vol, 0), 100);
        volumeSlider.value = currentVolume;
        audio.volume = currentVolume / 100;
        valueDisplay.textContent = `Volume: ${currentVolume}%`;
    }

    function resetStone() {
        position = 10;
        velocity = 0;
        stone.style.left = position + 'px';
        stone.style.transform = 'translateY(-50%) rotate(0deg)';
        launchBtn.disabled = false;
        sweepBtn.disabled = true;
    }

    // EVENTO LANCIO
    launchBtn.addEventListener('click', () => {
        if (audio.paused) audio.play().catch(() => {});
        
        // Assegna una spinta iniziale fissa ma "insufficiente" senza la scopa
        velocity = 3.5; 
        isMoving = true;
        launchBtn.disabled = true;
        sweepBtn.disabled = false;

        function slideStone() {
            position += velocity;
            // Attrito severo
            velocity -= 0.04; 
            
            // Applica sia il movimento in asse X, che il mantenimento in centro Y (-50%), più la rotazione
            stone.style.left = position + 'px';
            stone.style.transform = `translateY(-50%) rotate(${position * 2}deg)`;

            // CALCOLO CENTRO ESATTO
            const trackWidth = iceTrack.offsetWidth;
            const targetCenter = trackWidth - 60; // Centro esatto del bersaglio a 100px di larghezza, posizionato a right:10px
            const stoneCenter = position + (stone.offsetWidth / 2);

            // FALLIMENTO: Se supera il centro del bersaglio! (Con 15px di pietà)
            if (stoneCenter > targetCenter + 15) {
                isMoving = false;
                cancelAnimationFrame(animationFrame);
                sweepBtn.disabled = true;

                updateVolume(0);
                mockSound.volume = 1;
                mockSound.currentTime = 0;
                mockSound.play().catch(()=>{});
                
                localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
                
                valueDisplay.textContent = "Volume: 0% (You swept too much!)";
                valueDisplay.style.color = "#f44336";
                
                setTimeout(resetStone, 2000);
                return;
            }

            // LA PIETRA SI È FERMATA NORMALMENTE
            if (velocity <= 0) {
                isMoving = false;
                cancelAnimationFrame(animationFrame);
                sweepBtn.disabled = true;
                
                // Calcola il volume come percentuale di avvicinamento al centro
                let startPos = 10 + (stone.offsetWidth / 2);
                let travelDistance = targetCenter - startPos;
                let actualTraveled = stoneCenter - startPos;
                
                let vol = Math.round((actualTraveled / travelDistance) * 100);
                if (vol < 0) vol = 0;
                if (vol > 100) vol = 100; // Sicurezza

                updateVolume(vol);
                valueDisplay.style.color = "white";
                
                setTimeout(resetStone, 2500); 
                return;
            }

            animationFrame = requestAnimationFrame(slideStone);
        }

        animationFrame = requestAnimationFrame(slideStone);
    });

    // EVENTO SPAZZATA (Il cuore della Bad UI)
    sweepBtn.addEventListener('click', () => {
        if (isMoving && velocity > 0) {
            // Spazzando riduci l'attrito istantaneamente e prolunghi il viaggio
            velocity += 0.20; 
            
            sweepBtn.style.transform = "scale(0.9)";
            setTimeout(() => sweepBtn.style.transform = "scale(1)", 50);
        }
    });
}
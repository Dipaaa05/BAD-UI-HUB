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
        stone.style.transform = 'translateY(-50%) rotate(0deg)'; // Resetta anche la rotazione visiva
        launchBtn.disabled = false;
        sweepBtn.disabled = true;
    }

    // EVENTO LANCIO
    launchBtn.addEventListener('click', () => {
        if (audio.paused) audio.play().catch(() => {});
        if (isMoving) return;

        isMoving = true;
        launchBtn.disabled = true;
        sweepBtn.disabled = false; // Attiva la scopa!
        
        // Il lancio iniziale è debolissimo. Da solo porterebbe il volume max al 15%
        velocity = 1.2 + Math.random() * 0.5; 
        
        function slideStone() {
            position += velocity;
            // Attrito del ghiaccio (rallenta costantemente la pietra)
            velocity -= 0.012; 

            stone.style.left = position + 'px';
            
            // Fa girare leggermente la pietra per effetto visivo
            stone.style.transform = `translateY(-50%) rotate(${position}deg)`;

            const maxPos = iceTrack.clientWidth - stone.clientWidth;

            // HA SUPERATO LA PISTA? (Sballato oltre il 100%)
            if (position >= maxPos + 20) {
                isMoving = false;
                cancelAnimationFrame(animationFrame);
                updateVolume(0);
                mockSound.volume = 1;
                mockSound.currentTime = 0;
                mockSound.play();
                valueDisplay.textContent = "Volume: 0% (Out of range!)";
                valueDisplay.style.color = "red";
                
                // Resetta dopo 2 secondi
                setTimeout(resetStone, 2000);
                return;
            }

            // LA PIETRA SI È FERMATA
            if (velocity <= 0) {
                isMoving = false;
                cancelAnimationFrame(animationFrame);
                sweepBtn.disabled = true; // Disabilita la scopa
                
                // Calcola il volume in base a dove si è fermata (da 10 a maxPos)
                let vol = Math.round(((position - 10) / (maxPos - 10)) * 100);
                updateVolume(vol);
                valueDisplay.style.color = "white";
                
                // Pronto per il prossimo lancio
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
            // Spazzando riduci l'attrito istantaneamente, prolungando il viaggio.
            // Aggiungiamo un piccolo boost alla velocità!
            velocity += 0.18; 
            
            // Effetto grafico sul tasto
            sweepBtn.style.transform = "scale(0.9)";
            setTimeout(() => sweepBtn.style.transform = "scale(1)", 50);
        }
    });
}
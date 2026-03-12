document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById('drop-area');
    const sourceSpeaker = document.getElementById('source-speaker');
    const volumeSlider = document.getElementById('volume');
    const volumeText = document.getElementById('value');
    const mainAudio = document.getElementById('audio');
    const errorSound = document.getElementById('mock-sound');
    
    let currentVolume = 0;
    const iconSize = 30; // La hitbox effettiva degli elementi droppati

    // Carica i fallimenti dal Local Storage (invisibile all'utente in questa pagina)
    let failureCount = parseInt(localStorage.getItem('dragDropFailures')) || 0;

    // Inizializza volume audio a 0
    mainAudio.volume = 0;

    // Configura il drag and drop per il cesto
    sourceSpeaker.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', 'speaker');
        e.dataTransfer.effectAllowed = 'copy';
    });

    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault(); // Permette il drop
        e.dataTransfer.dropEffect = 'copy';
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        
        // Calcola coordinate relative all'area di rilascio
        const rect = dropArea.getBoundingClientRect();
        let x = e.clientX - rect.left - (iconSize / 2);
        let y = e.clientY - rect.top - (iconSize / 2);

        // Limita l'uscita dai bordi
        x = Math.max(0, Math.min(x, dropArea.clientWidth - iconSize));
        y = Math.max(0, Math.min(y, dropArea.clientHeight - iconSize));

        // Rileva eventuali collisioni
        const existingSpeakers = document.querySelectorAll('.dropped-speaker:not(.destroyed)');
        let collisionTarget = null;

        for (let speaker of existingSpeakers) {
            const spLeft = parseFloat(speaker.style.left);
            const spTop = parseFloat(speaker.style.top);
            
            // Logica hitbox: margine di tolleranza all'80% per essere severi
            if (Math.abs(x - spLeft) < iconSize * 0.8 && Math.abs(y - spTop) < iconSize * 0.8) {
                collisionTarget = speaker;
                break;
            }
        }

        if (collisionTarget) {
            // COLLISIONE: distrugge l'icona
            collisionTarget.classList.add('destroyed');
            collisionTarget.textContent = '💥';
            
            // Aggiorna silenziosamente il Local Storage
            failureCount++;
            localStorage.setItem('dragDropFailures', failureCount);
            
            if (errorSound) {
                errorSound.currentTime = 0;
                errorSound.play().catch(e => console.log("Audio play prevented"));
            }
            
            setTimeout(() => {
                collisionTarget.remove();
            }, 200);

            // Perde 1% di volume per la punizione
            currentVolume = Math.max(0, currentVolume - 1);
            
        } else {
            // NESSUNA COLLISIONE: posiziona l'altoparlante
            const newSpeaker = document.createElement('div');
            newSpeaker.classList.add('dropped-speaker');
            newSpeaker.textContent = '🔊';
            newSpeaker.style.left = `${x}px`;
            newSpeaker.style.top = `${y}px`;
            
            dropArea.appendChild(newSpeaker);
            
            // Guadagna 1% di volume
            currentVolume = Math.min(100, currentVolume + 1);
        }

        updateVolumeUI();
    });

    function updateVolumeUI() {
        // Aggiorna slider visivo, testo e volume reale della musica
        volumeSlider.value = currentVolume;
        volumeText.textContent = `Volume: ${currentVolume}%`;
        mainAudio.volume = currentVolume / 100;
    }
});
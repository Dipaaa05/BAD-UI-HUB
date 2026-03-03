window.onload = function() {
    const audio = document.getElementById('audio');
    const valueDisplay = document.getElementById('value');
    const thumb = document.getElementById('patience-thumb');
    const fill = document.getElementById('patience-fill');

    let currentVolume = 0; 
    let isDragging = false;
    let lastMouseX = 0;
    
    audio.volume = 0;

    function updateUI() {
        if (currentVolume < 0) currentVolume = 0;
        if (currentVolume > 100) currentVolume = 100;

        audio.volume = currentVolume / 100;
        valueDisplay.textContent = `Volume: ${currentVolume.toFixed(4)}%`;

        fill.style.width = currentVolume + '%';
        thumb.style.left = currentVolume + '%';
    }

    // --- LA CORREZIONE È QUI ---
    thumb.addEventListener('mousedown', (e) => {
        // Questa riga impedisce al browser di fare il suo "drag fantasma"
        e.preventDefault(); 
        
        isDragging = true;
        lastMouseX = e.clientX;
        if (audio.paused) audio.play().catch(() => {});
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaX = e.clientX - lastMouseX;
        lastMouseX = e.clientX;

        if (deltaX > 0) {
            currentVolume += deltaX * 0.0015; 
        } else if (deltaX < 0) {
            currentVolume += deltaX * 0.015; 
        }

        updateUI();
    });

    setInterval(() => {
        if (!isDragging && currentVolume > 0) {
            currentVolume -= 0.002; 
            updateUI();
        }
    }, 10);
}
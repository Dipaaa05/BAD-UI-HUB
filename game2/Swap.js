window.onload = function() {
    const volumeSlider = document.getElementById('volume');
    const audio = document.getElementById('audio');
    const mockSound = document.getElementById('mock-sound');
    const valueDisplay = document.getElementById('value');
    
    const addBtn = document.getElementById('add-btn');
    const resetBtn = document.getElementById('reset-btn');
    const buttonsWrapper = document.getElementById('buttons-wrapper');

    let currentVolume = 0;
    let lastClickTime = 0;
    let isSwapped = false;
    
    // Variabili per il "Secchio Bucato"
    let leakTimeout;
    let leakInterval;

    audio.volume = 0;

    function updateVolume() {
        volumeSlider.value = currentVolume;
        audio.volume = currentVolume / 100;
        valueDisplay.textContent = `Volume: ${currentVolume}%`;
        
        // 2. Il Bottone Timido: calcola quanto deve rimpicciolirsi
        // A 0% è scala 1 (100%), a 100% è scala 0.3 (30%)
        let scaleValue = 1 - (currentVolume * 0.007);
        addBtn.style.transform = `scale(${scaleValue})`;
    }

    function swapButtons() {
        isSwapped = !isSwapped;
        buttonsWrapper.style.flexDirection = isSwapped ? "row-reverse" : "row";
    }

    // 1. Il Secchio Bucato: inizia a far perdere volume
    function startLeaking() {
        clearInterval(leakInterval);
        leakInterval = setInterval(() => {
            if (currentVolume > 0) {
                currentVolume--;
                updateVolume();
            }
        }, 300); // Perde 1% ogni 300 millisecondi di inattività!
    }

    // Ferma la perdita di volume e resetta il timer (l'utente sta cliccando)
    function resetLeakTimer() {
        clearInterval(leakInterval);
        clearTimeout(leakTimeout);
        // Se si ferma per più di 800ms, inizia a scendere
        leakTimeout = setTimeout(startLeaking, 800); 
    }

    // Evento Click: +1% Volume
    addBtn.addEventListener('click', function() {
        if (audio.paused) audio.play().catch(() => {});

        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - lastClickTime;
        lastClickTime = currentTime;

        resetLeakTimer(); // Tieni il secchio "tappato" mentre clicca

        // 3. Falso Senso di Sicurezza: scambia i bottoni solo se sta spammando E ha superato il 60%
        if (timeSinceLastClick < 250 && currentVolume > 60) {
            if (Math.random() > 0.4) { // 60% di probabilità di scambio ad ogni click veloce
                swapButtons();
            }
        }

        if (currentVolume < 100) {
            currentVolume++;
            updateVolume();
        }
    });

    // 4. Suono di Scherno: Click sul RESET (spesso per sbaglio)
    resetBtn.addEventListener('click', function() {
        currentVolume = 0;
        updateVolume();
        
        // Suona il triste trombone (abbassando Drake per farsi sentire)
        mockSound.volume = 1;
        mockSound.currentTime = 0;
        mockSound.play();

        // Rimette a posto le cose
        if (isSwapped) swapButtons();
        resetLeakTimer(); 
    });
}
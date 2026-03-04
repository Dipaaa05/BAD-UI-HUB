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
        let scaleValue = 1 - (currentVolume * 0.007);
        addBtn.style.transform = `scale(${scaleValue})`;
    }

    function swapButtons() {
        isSwapped = !isSwapped;
        buttonsWrapper.style.flexDirection = isSwapped ? "row-reverse" : "row";
    }

    // 1. Il Secchio Bucato: perde 1% ogni 300ms di inattività
    function startLeaking() {
        clearInterval(leakInterval);
        leakInterval = setInterval(() => {
            if (currentVolume > 0) {
                currentVolume--;
                updateVolume();
            }
        }, 300); 
    }

    function resetLeakTimer() {
        clearInterval(leakInterval);
        clearTimeout(leakTimeout);
        leakTimeout = setTimeout(startLeaking, 800); 
    }

    // --- NUOVA MECCANICA: LO SWAP FANTASMA (Indipendente dalla velocità) ---
    function scheduleRandomSwap() {
        // Scatta in un momento casuale tra 0.4 e 1.5 secondi
        const delay = Math.random() * 1100 + 400;
        
        setTimeout(() => {
            // La probabilità di swap cresce man mano che l'utente clicca!
            // Es: currentVolume a 80 -> 80% di probabilità di scambiarsi
            const swapChance = currentVolume / 100;
            
            // Scambia solo se ha superato almeno il 5% e il "dado" fa un numero minore della probabilità
            if (currentVolume > 5 && Math.random() < swapChance) {
                swapButtons();
            }
            
            scheduleRandomSwap(); // Loop infinito
        }, delay);
    }

    // Avvia il timer fantasma appena si apre la pagina
    scheduleRandomSwap();


    // --- EVENTO CLICK: +1% Volume ---
    addBtn.addEventListener('click', function(e) {
        if (e) e.preventDefault();
        if (audio.paused) audio.play().catch(() => {});

        // 3. IL CALCOLO DEI CLICK AL SECONDO (Mantenuto per punire lo spam)
        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - lastClickTime;
        lastClickTime = currentTime;

        // Punizione per chi clicca in preda al panico (meno di 120ms): 
        // Il bottone diventa ancora più piccolo del normale per un attimo
        if (timeSinceLastClick < 120) {
            let panicScale = 1 - (currentVolume * 0.009); // Rimpicciolimento maggiorato
            addBtn.style.transform = `scale(${panicScale})`;
        }

        resetLeakTimer(); 

        if (currentVolume < 100) {
            currentVolume++;
            updateVolume();
        }
    });

    // --- EVENTO CLICK: RESET (La trappola) ---
    resetBtn.addEventListener('click', function(e) {
        if (e) e.preventDefault();
        
        currentVolume = 0;
        updateVolume();
        
        // Suona il triste trombone
        mockSound.volume = 1;
        mockSound.currentTime = 0;
        mockSound.play();
        
        // Aggiorna il contatore dei fallimenti nel LocalStorage
        localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);

        // Rimette a posto le cose per fargli rifare la fatica
        if (isSwapped) swapButtons();
        resetLeakTimer(); 
    });
}
document.addEventListener('DOMContentLoaded', () => {
    const actionBtn = document.getElementById('action-btn');
    const reels = [
        document.getElementById('reel-1'),
        document.getElementById('reel-2'),
        document.getElementById('reel-3')
    ];
    const symbols = [
        document.querySelector('#reel-1 .symbol'),
        document.querySelector('#reel-2 .symbol'),
        document.querySelector('#reel-3 .symbol')
    ];
    const currentVolSpan = document.getElementById('current-vol');
    const jackpotBanner = document.getElementById('jackpot-banner');
    const jackpotVal = document.getElementById('jackpot-val');
    const acceptDefeatBtn = document.getElementById('accept-defeat');

    // Elementi Audio
    const bgAudio = document.getElementById('background-audio');
    const mockSound = new Audio('../../../audio/mocksound.mp3');
    let audioUnlocked = false; // Flag per controllare se l'audio è sbloccato

    // Valori possibili per i rulli
    const reel1Values = [0, 10, 25, 50, 75, 90, 100, 999]; // 999 per overflow
    const reel2Values = ['+', '-', '*', '/']; 
    const reel3Values = [0, 5, 10, 50, 100];

    let gameState = 0; // 0: Fermo, 1: Rullo 1, 2: Rullo 2, 3: Rullo 3
    let results = [0, '+', 0];
    let isWaitingForDelay = false;

    let spinIntervals = [];
    function startVisualSpin() {
        reels.forEach((reel, index) => {
            reel.classList.add('spinning');
            spinIntervals[index] = setInterval(() => {
                let randomVal;
                if (index === 0) randomVal = reel1Values[Math.floor(Math.random() * reel1Values.length)];
                else if (index === 1) randomVal = reel2Values[Math.floor(Math.random() * reel2Values.length)];
                else randomVal = reel3Values[Math.floor(Math.random() * reel3Values.length)];
                symbols[index].innerText = randomVal;
            }, 50);
        });
    }

    function stopReel(reelIndex) {
        clearInterval(spinIntervals[reelIndex]);
        reels[reelIndex].classList.remove('spinning');
        
        let finalVal;
        if (reelIndex === 0) finalVal = reel1Values[Math.floor(Math.random() * reel1Values.length)];
        else if (reelIndex === 1) finalVal = reel2Values[Math.floor(Math.random() * reel2Values.length)];
        else finalVal = reel3Values[Math.floor(Math.random() * reel3Values.length)];
        
        symbols[reelIndex].innerText = finalVal;
        results[reelIndex] = finalVal;
    }

    actionBtn.addEventListener('click', () => {
        // --- SBLOCCO AUDIO AL PRIMO CLICK ---
        // Questo inganna il browser facendogli credere che l'utente vuole riprodurre audio,
        // sbloccando le riproduzioni automatiche successive per questa sessione.
        if (!audioUnlocked) {
            mockSound.play().then(() => {
                mockSound.pause();
                mockSound.currentTime = 0;
            }).catch(e => console.log("Impossibile pre-sbloccare audio mockSound", e));
            
            if (bgAudio) {
                bgAudio.volume = 0.5; // Parte al 50% di base
                bgAudio.play().catch(e => console.log("Impossibile avviare bgAudio", e));
            }
            audioUnlocked = true;
        }

        // Ignora il click se stiamo già calcolando un delay (Input Lag forzato)
        if (isWaitingForDelay) return;

        if (gameState === 0) {
            // Avvia la slot
            startVisualSpin();
            gameState = 1;
            actionBtn.innerText = "STOP REEL 1";
            
            // Gestione pulita dei colori tramite classi CSS
            actionBtn.classList.remove('start-mode');
            actionBtn.classList.add('reel-mode');
        } 
        else if (gameState >= 1 && gameState <= 3) {
            isWaitingForDelay = true;
            actionBtn.classList.add('stopping');
            
            // Gaslighting testuale
            actionBtn.innerText = "STOPPING...";

            // Delay randomico tra 0.5 e 2.5 secondi
            const randomDelay = Math.random() * 2000 + 500;

            setTimeout(() => {
                stopReel(gameState - 1);
                
                gameState++;
                isWaitingForDelay = false;
                actionBtn.classList.remove('stopping');

                if (gameState === 2) {
                    actionBtn.innerText = "STOP REEL 2";
                } else if (gameState === 3) {
                    actionBtn.innerText = "STOP REEL 3";
                } else if (gameState === 4) {
                    actionBtn.innerText = "CALCULATING...";
                    setTimeout(calculateVolume, 1000); // Suspense
                }
            }, randomDelay);
        }
    });

    function calculateVolume() {
        let val1 = parseFloat(results[0]);
        let operator = results[1];
        let val2 = parseFloat(results[2]);
        let finalVolume = 0;

        switch(operator) {
            case '+': finalVolume = val1 + val2; break;
            case '-': finalVolume = val1 - val2; break;
            case '*': finalVolume = val1 * val2; break;
            case '/': 
                finalVolume = val2 === 0 ? Infinity : val1 / val2; 
                break;
        }

        if(finalVolume !== Infinity) finalVolume = Math.round(finalVolume);

        if (finalVolume > 100 || finalVolume === Infinity) {
            // --- OVERFLOW JACKPOT ---
            jackpotVal.innerText = finalVolume;
            jackpotBanner.classList.remove('hidden');
            
            // Riproduci suono di scherno (ora funzionerà grazie allo sblocco preventivo)
            mockSound.play().catch(e => console.log("Audio blocked", e));

            let fails = parseInt(localStorage.getItem('badui_fails') || '0');
            localStorage.setItem('badui_fails', fails + 1);
            
            finalVolume = 0; // Punizione
        } else if (finalVolume < 0) {
            finalVolume = 0; // Non esiste il volume negativo
        }

        currentVolSpan.innerText = finalVolume;
        
        // --- APPLICA IL VOLUME REALE ---
        if (bgAudio) {
            // L'API del volume audio va da 0.0 a 1.0
            bgAudio.volume = finalVolume / 100;
        }
        
        // Reset per la prossima partita
        gameState = 0;
        actionBtn.innerText = "START";
        actionBtn.classList.remove('reel-mode');
        actionBtn.classList.add('start-mode');
    }

    // Chiusura del banner
    acceptDefeatBtn.addEventListener('click', () => {
        jackpotBanner.classList.add('hidden');
    });
});
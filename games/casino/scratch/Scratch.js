document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("scratch-canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const resultText = document.getElementById("scratch-result");
    const container = document.getElementById("scratch-container");
    const btnNewTicket = document.getElementById("new-ticket-btn");
    const volumeText = document.getElementById("current-volume-text");
    const audio = document.getElementById("audio");
    const mockSound = document.getElementById("mock-sound"); // Recuperiamo il suono di scherno

    let isDrawing = false;
    let targetVolume = 100;
    let isRevealed = false;
    let jitterInterval;

    // Bad UI Parametri
    const SCRATCH_RADIUS = 8; // Raggio piccolissimo per renderlo frustrante
    const PERCENTAGE_TO_WIN = 50; // Percentuale da grattare per vincere
    const TROLL_CHANCE = 0.25; // 25% di probabilità di trovare "RITENTA"

    function initTicket() {
        isRevealed = false;
        isDrawing = false;
        
        // Determina il premio
        if (Math.random() < TROLL_CHANCE) {
            targetVolume = "TROLL";
            resultText.innerText = "TRY AGAIN!";
            resultText.style.color = "#f44336";
        } else {
            targetVolume = Math.floor(Math.random() * 101); // 0-100
            resultText.innerText = targetVolume + "%";
            resultText.style.color = "#1a1a1a";
        }

        // Disegna la patina argentea
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "#a0a0a0"; // Colore argento/grigio
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Aggiungi un pattern finto alla patina
        ctx.fillStyle = "#808080";
        for(let i=0; i<50; i++) {
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 10, 10);
        }

        // Imposta il metodo di fusione per "cancellare"
        ctx.globalCompositeOperation = "destination-out";
        
        // Riporta il contenitore al centro
        container.style.transform = `translate(0px, 0px) rotate(0deg)`;
        
        startJitter();
    }

    // --- LOGICA DI MOVIMENTO (JITTER) ---
    function startJitter() {
        clearInterval(jitterInterval);
        jitterInterval = setInterval(() => {
            if (isRevealed) return; // Si ferma se hai vinto

            // Tremolio e spostamenti casuali fastidiosi
            const rx = (Math.random() - 0.5) * 50; // Spostamento X (da -25 a 25)
            const ry = (Math.random() - 0.5) * 50; // Spostamento Y (da -25 a 25)
            const rot = (Math.random() - 0.5) * 10; // Rotazione (da -5 a 5 gradi)

            container.style.transform = `translate(${rx}px, ${ry}px) rotate(${rot}deg)`;
        }, 400); // Cambia posizione ogni 400ms
    }

    // --- LOGICA DEL GRATTA E VINCI ---
    function getPointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        // Supporto per touch e mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function scratch(e) {
        if (!isDrawing || isRevealed) return;
        e.preventDefault(); // Previene lo scroll su touch

        const pos = getPointerPos(e);
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, SCRATCH_RADIUS, 0, Math.PI * 2, false);
        ctx.fill();
    }

    function checkWin() {
        if (isRevealed) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let clearPixels = 0;

        // Controlla il canale Alpha di ogni pixel (ogni 4 valori: R, G, B, A)
        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] === 0) {
                clearPixels++;
            }
        }

        const totalPixels = canvas.width * canvas.height;
        const clearedPercentage = (clearPixels / totalPixels) * 100;

        if (clearedPercentage >= PERCENTAGE_TO_WIN) {
            isRevealed = true;
            clearInterval(jitterInterval);
            
            // Pulisce tutto per mostrare il risultato chiaramente
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            container.style.transform = `translate(0px, 0px) rotate(0deg)`; // Raddrizza

            if (targetVolume === "TROLL") {
                audio.volume = 0; // Punizione
                mockSound.volume = 1;
                mockSound.currentTime = 0; // Fa ripartire l'audio dall'inizio
                mockSound.play(); // Suono di scherno
                volumeText.innerText = "Current volume: Try again! You'll be luckier next time.";
                volumeText.style.color = "#f44336";
                // Aggiorna il contatore dei fallimenti nel LocalStorage
                localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
            } else {
                audio.volume = targetVolume / 100;
                volumeText.innerText = `Current volume: ${targetVolume}%`;
                volumeText.style.color = "#4CAF50";
            }
        }
    }

    // --- EVENT LISTENERS ---
    canvas.addEventListener("mousedown", (e) => { isDrawing = true; scratch(e); });
    canvas.addEventListener("mousemove", scratch);
    canvas.addEventListener("mouseup", () => { isDrawing = false; checkWin(); });
    
    // BAD UI: Se il cursore esce dal canvas prima di vincere, la patina si ricarica! (Punizione)
    canvas.addEventListener("mouseleave", () => { 
        isDrawing = false; 
        if(!isRevealed) {
            audio.volume = 0; // Punizione
            mockSound.volume = 1;
            mockSound.currentTime = 0; // Fa ripartire l'audio dall'inizio
            mockSound.play(); // Suono di scherno
            volumeText.innerText = "Current volume: scratching incomplete! Try again.";
            volumeText.style.color = "#f44336";
            localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
            initTicket(); // Ricomincia da capo!
        }
    });

    // Supporto Touch (Mobile)
    canvas.addEventListener("touchstart", (e) => { isDrawing = true; scratch(e); }, {passive: false});
    canvas.addEventListener("touchmove", scratch, {passive: false});
    canvas.addEventListener("touchend", () => { isDrawing = false; checkWin(); });

    btnNewTicket.addEventListener("click", initTicket);

    // Inizializza il primo ticket
    initTicket();
});
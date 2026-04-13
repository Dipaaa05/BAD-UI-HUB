document.addEventListener("DOMContentLoaded", () => {
    const toast = document.getElementById("toast");
    const lever = document.getElementById("lever");
    const statusMsg = document.getElementById("status-msg");
    const valueDisplay = document.getElementById("value");
    const audio = document.getElementById("audio");
    const mockSound = document.getElementById("mock-sound");
    const retryBtn = document.getElementById("retry-btn");
    const smokeContainer = document.getElementById("smoke-container");
    const cookingTimer = document.getElementById("cooking-timer");

    let isToasting = false;
    let cookingLevel = 0; // 0 a 100+
    let cookingInterval;
    let startTime;

    function updateToastColor(level) {
        if (level > 100) {
            toast.style.background = "#222"; // Carbonizzato
            return;
        }
        
        // Interpolazione tra beige (#f5e1c8) e marrone (#8d5524)
        const r = Math.floor(245 - (level * (245 - 141) / 100));
        const g = Math.floor(225 - (level * (225 - 85) / 100));
        const b = Math.floor(200 - (level * (200 - 36) / 100));
        toast.style.background = `rgb(${r}, ${g}, ${b})`;
    }

    function startToasting() {
        if (retryBtn.style.display === "block") return;
        
        isToasting = true;
        // Randomizza la velocità per ogni nuova cottura (range tra 0.2 e 1.2)
        const currentCookingSpeed = 0.2 + Math.random() * 1.0;
        
        cookingLevel = 0;
        lever.classList.add("active");
        toast.classList.add("cooking");
        cookingTimer.style.opacity = "1";
        statusMsg.innerText = "Toasting...";
        statusMsg.style.color = "white";
        
        if (audio.paused) audio.play().catch(() => {});
        
        cookingInterval = setInterval(() => {
            cookingLevel += currentCookingSpeed;
            cookingTimer.innerText = `${Math.round(cookingLevel)}%`;
            
            // Svanisce gradualmente intorno al 20%
            cookingTimer.style.opacity = Math.max(0, 1 - (cookingLevel / 20));
            updateToastColor(cookingLevel);

            // Effetto fumo se sta bruciando
            if (cookingLevel > 105 && cookingLevel % 10 < 1) {
                createSmoke();
            }
            
            if (cookingLevel > 150) { // Limite massimo per non andare all'infinito
                stopToasting();
            }
        }, 50);
    }

    function stopToasting() {
        if (!isToasting) return;
        isToasting = false;
        clearInterval(cookingInterval);
        
        lever.classList.remove("active");
        toast.classList.remove("cooking");
        cookingTimer.style.opacity = "0";

        if (cookingLevel > 100) {
            burnToast();
        } else {
            finishToast();
        }
    }

    function finishToast() {
        const finalVol = Math.round(cookingLevel);
        updateToastColor(finalVol);
        audio.volume = finalVol / 100;
        valueDisplay.innerText = `Volume: ${finalVol}%`;
        statusMsg.innerText = "Perfectly toasted!";
        statusMsg.style.color = "#4CAF50";
    }

    function burnToast() {
        updateToastColor(110);
        audio.volume = 0;
        valueDisplay.innerText = "Volume: 0%";
        statusMsg.innerText = "IT'S BURNT! FIRE!";
        statusMsg.style.color = "#f44336";
        
        mockSound.play().catch(() => {});
        localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
        
        retryBtn.style.display = "block";
    }

    function createSmoke() {
        const smoke = document.createElement("div");
        smoke.className = "smoke";
        smoke.style.left = Math.random() * 100 + 50 + "px";
        smokeContainer.appendChild(smoke);
        setTimeout(() => smoke.remove(), 2000);
    }

    function resetToaster() {
        cookingLevel = 0;
        updateToastColor(0);
        cookingTimer.innerText = "0%";
        cookingTimer.style.opacity = "1";
        retryBtn.style.display = "none";
        statusMsg.innerText = "Pull the lever to start cooking...";
        statusMsg.style.color = "white";
        smokeContainer.innerHTML = "";
    }

    // Event Listeners
    lever.addEventListener("mousedown", startToasting);
    window.addEventListener("mouseup", stopToasting);

    // Supporto Mobile
    lever.addEventListener("touchstart", (e) => {
        e.preventDefault();
        startToasting();
    });
    window.addEventListener("touchend", stopToasting);

    retryBtn.addEventListener("click", resetToaster);
});
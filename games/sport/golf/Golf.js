document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("golfCanvas");
    const ctx = canvas.getContext("2d");
    const valueDisplay = document.getElementById("value");
    const strokeDisplay = document.getElementById("stroke-count");
    const distDisplay = document.getElementById("dist-count");
    const statusOverlay = document.getElementById("status-overlay");
    const statusText = document.getElementById("status-text");
    const restartBtn = document.getElementById("restart-btn");
    const shootBtn = document.getElementById("shoot-btn");
    const audio = document.getElementById("audio");
    const mockSound = document.getElementById("mock-sound");

    const powerBar = document.getElementById("power-bar");

    // Stato di gioco
    let ball = { x: 50, y: 150, vx: 0, vy: 0, radius: 6 };
    let hole = { x: 340, y: 150, radius: 10 };
    let strokes = 0;
    let totalPath = 0;
    let minDistance = 0;
    let isMoving = false;
    let isGameOver = false;
    
    // UI Meters
    let powerVal = 0;
    let powerDir = 1;
    let aimAngle = 0; // Angolo in radianti
    const rotationSpeed = 0.06; // Velocità rotazione freccia

    function initLevel() {
        ball.x = 50;
        ball.y = 50 + Math.random() * 200;
        hole.x = 300 + Math.random() * 70;
        hole.y = 50 + Math.random() * 200;
        
        ball.vx = 0;
        ball.vy = 0;
        strokes = 0;
        totalPath = 0;
        isMoving = false;
        isGameOver = false;
        aimAngle = 0;
        
        // Calcola distanza minima per il punteggio
        const dx = hole.x - ball.x;
        const dy = hole.y - ball.y;
        minDistance = Math.sqrt(dx * dx + dy * dy);

        statusOverlay.classList.add("hidden");
        updateStats();
        updateVolumeDisplay(0);
    }

    function updateStats() {
        strokeDisplay.innerText = strokes;
        distDisplay.innerText = Math.round(totalPath);
    }

    function updateVolumeDisplay(val) {
        audio.volume = val / 100;
        valueDisplay.innerText = `Volume: ${Math.round(val)}%`;
    }

    shootBtn.addEventListener("click", () => {
        if (isMoving || isGameOver) return;
        if (audio.paused) audio.play().catch(() => {});

        hitBall();
    });

    function hitBall() {
        strokes++;
        isMoving = true;
        
        // Calcolo forza: powerVal (0-100)
        const force = (powerVal / 100) * 14;
        
        ball.vx = Math.cos(aimAngle) * force;
        ball.vy = Math.sin(aimAngle) * force;
    }

    function updateMeters() {
        if (isMoving || isGameOver) return;

        powerVal += 3 * powerDir;
        if (powerVal >= 100 || powerVal <= 0) powerDir *= -1;
        powerBar.style.width = powerVal + "%";

        aimAngle += rotationSpeed;
        if (aimAngle > Math.PI * 2) aimAngle -= Math.PI * 2;
    }

    function checkHole() {
        const dx = ball.x - hole.x;
        const dy = ball.y - hole.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < hole.radius) {
            isMoving = false;
            ball.vx = 0;
            ball.vy = 0;
            victory();
        }
    }

    function drawAimArrow() {
        if (isMoving || isGameOver) return;
        
        const length = 40;
        ctx.save();
        ctx.translate(ball.x, ball.y);
        ctx.rotate(aimAngle);
        
        // Linea freccia
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(length, 0);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Punta freccia
        ctx.beginPath();
        ctx.moveTo(length, 0);
        ctx.lineTo(length - 8, -5);
        ctx.lineTo(length - 8, 5);
        ctx.fillStyle = "white";
        ctx.fill();
        
        ctx.restore();
    }

    function victory() {
        isGameOver = true;
        let finalVolume = 0;
        if (strokes === 1) {
            finalVolume = 100;
            statusText.innerText = "HOLE IN ONE! 100% VOL";
        } else {
            // Formula: (Distanza Minima / Distanza Totale) * 100
            finalVolume = (minDistance / totalPath) * 100;
            statusText.innerText = `HOLED! Score: ${Math.round(finalVolume)}%`;
        }

        updateVolumeDisplay(finalVolume);
        statusOverlay.classList.remove("hidden");
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Erba (texture finta)
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        for(let i=0; i<canvas.width; i+=20) ctx.fillRect(i, 0, 1, canvas.height);

        // Buca
        ctx.beginPath();
        ctx.arc(hole.x, hole.y, hole.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#000";
        ctx.fill();
        ctx.closePath();

        drawAimArrow();

        // Pallina
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.shadowBlur = 5;
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.closePath();
        ctx.shadowBlur = 0;

        if (isMoving) {
            const prevX = ball.x;
            const prevY = ball.y;

            ball.x += ball.vx;
            ball.y += ball.vy;

            // Attrito
            ball.vx *= 0.98;
            ball.vy *= 0.98;

            // Calcolo percorso
            const moveDist = Math.sqrt(Math.pow(ball.x - prevX, 2) + Math.pow(ball.y - prevY, 2));
            totalPath += moveDist;

            // Rimbalzi pareti
            if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) ball.vx *= -0.7;
            if (ball.y < ball.radius || ball.y > canvas.height - ball.radius) ball.vy *= -0.7;

            checkHole();

            if (Math.abs(ball.vx) < 0.1 && Math.abs(ball.vy) < 0.1) {
                isMoving = false;
                ball.vx = 0;
                ball.vy = 0;
                if (totalPath > 5000) { // Punizione se la palla impazzisce
                   gameOver();
                }
            }
            updateStats();
        }

        updateMeters();
        requestAnimationFrame(draw);
    }

    function gameOver() {
        isGameOver = true;
        isMoving = false;
        updateVolumeDisplay(0);
        mockSound.play().catch(() => {});
        localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
        statusText.innerText = "OUT OF BOUNDS / TOO FAR!";
        statusOverlay.classList.remove("hidden");
    }

    restartBtn.addEventListener("click", () => {
        initLevel();
    });

    initLevel();
    draw();
});
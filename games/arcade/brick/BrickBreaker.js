document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("brickCanvas");
    const ctx = canvas.getContext("2d");
    const valueDisplay = document.getElementById("value");
    const statusOverlay = document.getElementById("status-overlay");
    const statusText = document.getElementById("status-text");
    const restartBtn = document.getElementById("restart-btn");
    const audio = document.getElementById("audio");
    const mockSound = document.getElementById("mock-sound");

    // Parametri di gioco
    let ballRadius = 8;
    let x, y, dx, dy;
    let paddleHeight = 10;
    let paddleWidth = 80;
    let paddleX;
    let targetPaddleX; // Per l'inerzia
    
    // Mattoni
    const rowCount = 5;
    const columnCount = 7;
    const brickWidth = 50;
    const brickHeight = 15;
    const brickPadding = 5;
    const brickOffsetTop = 30;
    const brickOffsetLeft = 10;
    let bricks = [];
    let bricksBroken = 0;
    const totalBricks = rowCount * columnCount;

    let isGameOver = false;

    function initLevel() {
        x = canvas.width / 2;
        y = canvas.height - 30;
        dx = 2;
        dy = -2;
        paddleX = (canvas.width - paddleWidth) / 2;
        targetPaddleX = paddleX;
        bricksBroken = 0;
        isGameOver = false;
        statusOverlay.classList.add("hidden");
        
        bricks = [];
        for (let c = 0; c < columnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < rowCount; r++) {
                bricks[c][r] = { x: 0, y: 0, status: 1 };
            }
        }
        updateVolume(0);
    }

    function updateVolume(val) {
        audio.volume = val / 100;
        valueDisplay.innerText = `Volume: ${Math.round(val)}%`;
        // Restringi il paddle man mano che il volume sale
        paddleWidth = 80 - (val * 0.5); 
    }

    document.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        if (relativeX > 0 && relativeX < canvas.width) {
            targetPaddleX = relativeX - paddleWidth / 2;
        }
    });

    function collisionDetection() {
        for (let c = 0; c < columnCount; c++) {
            for (let r = 0; r < rowCount; r++) {
                let b = bricks[c][r];
                if (b.status === 1) {
                    // Trova il punto sul mattone più vicino al centro della palla
                    let closestX = Math.max(b.x, Math.min(x, b.x + brickWidth));
                    let closestY = Math.max(b.y, Math.min(y, b.y + brickHeight));

                    // Calcola la distanza tra il centro della palla e il punto più vicino
                    let distanceX = x - closestX;
                    let distanceY = y - closestY;
                    let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

                    if (distanceSquared < (ballRadius * ballRadius)) {
                        // Determina se il rimbalzo è orizzontale o verticale
                        if (Math.abs(distanceX) > Math.abs(distanceY)) {
                            dx = -dx;
                        } else {
                            dy = -dy;
                        }
                        b.status = 0;
                        bricksBroken++;
                        let currentVol = (bricksBroken / totalBricks) * 100;
                        updateVolume(currentVol);

                        if (bricksBroken === totalBricks) {
                            victory();
                        }
                    }
                }
            }
        }
    }

    function drawBall() {
        ctx.beginPath();
        ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#FF5722";
        ctx.fill();
        ctx.closePath();
    }

    function drawPaddle() {
        ctx.beginPath();
        ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
        ctx.fillStyle = "#4CAF50";
        ctx.fill();
        ctx.closePath();
    }

    function drawBricks() {
        for (let c = 0; c < columnCount; c++) {
            for (let r = 0; r < rowCount; r++) {
                if (bricks[c][r].status === 1) {
                    let brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                    let brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                    bricks[c][r].x = brickX;
                    bricks[c][r].y = brickY;
                    ctx.beginPath();
                    ctx.rect(brickX, brickY, brickWidth, brickHeight);
                    ctx.fillStyle = `hsl(${200 + r * 20}, 70%, 50%)`;
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }

    function victory() {
        isGameOver = true;
        statusText.innerText = "MAX VOLUME REACHED!";
        statusText.style.color = "#4CAF50";
        statusOverlay.classList.remove("hidden");
    }

    function gameOver() {
        isGameOver = true;
        updateVolume(0);
        mockSound.play().catch(() => {});
        localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
        statusText.innerText = "VOLUME RESET!";
        statusText.style.color = "#f44336";
        statusOverlay.classList.remove("hidden");
    }

    function draw() {
        if (isGameOver) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawBall();
        drawPaddle();
        collisionDetection();

        // Inerzia del paddle (Bad UI: il paddle è "scivoloso")
        let lerpFactor = 0.1;
        paddleX += (targetPaddleX - paddleX) * lerpFactor;

        // Rimbalzo pareti
        if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
        if (y + dy < ballRadius) dy = -dy;
        else if (y + dy > canvas.height - paddleHeight - ballRadius) {
            // Controllo collisione Paddle (considerando il raggio)
            if (x > paddleX && x < paddleX + paddleWidth) {
                if (dy > 0) { // Rimbalza solo se la palla sta scendendo
                    let hitPoint = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
                    dx = hitPoint * 4;
                    dy = -dy;
                    // Snap della posizione sopra il paddle per evitare bug di collisione
                    y = canvas.height - paddleHeight - ballRadius;
                }
            } 
            // Se la palla manca il paddle e tocca il fondo
            else if (y + dy > canvas.height - ballRadius) {
                gameOver();
            }
        }

        x += dx;
        y += dy;
        requestAnimationFrame(draw);
    }

    restartBtn.addEventListener("click", () => {
        if (audio.paused) audio.play().catch(() => {});
        initLevel();
        draw();
    });

    initLevel();
    draw();
});
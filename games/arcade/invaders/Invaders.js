document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const volumeOverlay = document.getElementById("volume-overlay");
    const statusText = document.getElementById("status-text");
    const audio = document.getElementById("audio");
    const mockSound = document.getElementById("mock-sound");

    // Set canvas internal resolution
    canvas.width = 400;
    canvas.height = 400;

    let volume = 0;
    let lastHitTime = Date.now();
    let gameActive = true;

    const player = {
        x: canvas.width / 2 - 15,
        y: canvas.height - 40,
        w: 30,
        h: 20,
        speed: 5,
        movingLeft: false,
        movingRight: false
    };

    let bullets = [];
    let aliens = [];
    let alienBullets = [];
    let drops = [];

    // Initialize Aliens
    function spawnAliens() {
        aliens = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 7; col++) {
                aliens.push({
                    x: 40 + col * 45,
                    y: 40 + row * 35,
                    w: 25,
                    h: 20,
                    alive: true,
                    type: row === 0 ? 'elite' : 'normal'
                });
            }
        }
    }

    function updateVolume(delta) {
        volume = Math.max(0, Math.min(100, volume + delta));
        audio.volume = volume / 100;
        volumeOverlay.innerText = `Volume: ${Math.round(volume)}%`;
        
        if (delta > 0) lastHitTime = Date.now(); // Reset leak timer on gain
    }

    function shoot() {
        if (!gameActive) return;
        bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 10 });
    }

    // --- CONTROLS ---
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") player.movingLeft = true;
        if (e.key === "ArrowRight") player.movingRight = true;
        if (e.key === " ") shoot();
    });

    document.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft") player.movingLeft = false;
        if (e.key === "ArrowRight") player.movingRight = false;
    });

    // Mobile Controls
    document.getElementById("btn-left").onmousedown = () => player.movingLeft = true;
    document.getElementById("btn-left").onmouseup = () => player.movingLeft = false;
    document.getElementById("btn-left").ontouchstart = (e) => { e.preventDefault(); player.movingLeft = true; };
    document.getElementById("btn-left").ontouchend = () => player.movingLeft = false;

    document.getElementById("btn-right").onmousedown = () => player.movingRight = true;
    document.getElementById("btn-right").onmouseup = () => player.movingRight = false;
    document.getElementById("btn-right").ontouchstart = (e) => { e.preventDefault(); player.movingRight = true; };
    document.getElementById("btn-right").ontouchend = () => player.movingRight = false;

    document.getElementById("btn-shoot").onclick = shoot;

    // --- GAME ENGINE ---
    function update() {
        if (!gameActive) return;

        // Leaky Bucket Effect
        if (Date.now() - lastHitTime > 2000) {
            updateVolume(-0.05); // Lieve calo costante
        }

        // Player Movement
        if (player.movingLeft && player.x > 0) player.x -= player.speed;
        if (player.movingRight && player.x < canvas.width - player.w) player.x += player.speed;

        // Bullets
        bullets.forEach((b, i) => {
            b.y -= 7;
            if (b.y < 0) bullets.splice(i, 1);

            // Collision with aliens
            aliens.forEach(alien => {
                if (alien.alive && b.x < alien.x + alien.w && b.x + b.w > alien.x && b.y < alien.y + alien.h && b.y + b.h > alien.y) {
                    alien.alive = false;
                    bullets.splice(i, 1);
                    lastHitTime = Date.now();

                    // Chance to drop something
                    if (Math.random() < 0.4) {
                        const isMalus = Math.random() < 0.2;
                        drops.push({
                            x: alien.x, y: alien.y, w: 15, h: 15, 
                            type: isMalus ? 'malus' : 'bonus',
                            val: isMalus ? 0 : Math.floor(Math.random() * 5) + 1
                        });
                    }
                }
            });
        });

        // Drops
        drops.forEach((d, i) => {
            d.y += 2;
            if (d.x < player.x + player.w && d.x + d.w > player.x && d.y < player.y + player.h && d.y + d.h > player.y) {
                if (d.type === 'malus') {
                    volume = 0;
                    updateVolume(0);
                    statusText.innerText = "MALUS! Volume Reset!";
                    statusText.style.color = "#f44336";
                    mockSound.play();
                    localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
                } else {
                    updateVolume(d.val);
                    statusText.innerText = `+${d.val}% Volume!`;
                    statusText.style.color = "#4CAF50";
                }
                drops.splice(i, 1);
            }
            if (d.y > canvas.height) drops.splice(i, 1);
        });

        // Aliens & Shooting
        let allDead = true;
        aliens.forEach(alien => {
            if (alien.alive) {
                allDead = false;
                if (Math.random() < 0.005) {
                    alienBullets.push({ x: alien.x + alien.w / 2, y: alien.y + alien.h, w: 3, h: 8 });
                }
            }
        });
        if (allDead) spawnAliens();

        // Alien Bullets
        alienBullets.forEach((ab, i) => {
            ab.y += 4;
            if (ab.x < player.x + player.w && ab.x + ab.w > player.x && ab.y < player.y + player.h && ab.y + ab.h > player.y) {
                alienBullets.splice(i, 1);
                const isCritical = Math.random() < 0.15;
                const penalty = isCritical ? -10 : -1;
                updateVolume(penalty);
                statusText.innerText = isCritical ? "CRITICAL HIT! -10%" : "Hit! -1%";
                statusText.style.color = "#f44336";
            }
            if (ab.y > canvas.height) alienBullets.splice(i, 1);
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Player
        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(player.x, player.y, player.w, player.h);
        ctx.fillRect(player.x + 12, player.y - 5, 6, 5); // turret

        // Bullets
        ctx.fillStyle = "#fff";
        bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

        // Aliens
        aliens.forEach(a => {
            if (a.alive) {
                ctx.fillStyle = a.type === 'elite' ? "#9C27B0" : "#f44336";
                ctx.fillRect(a.x, a.y, a.w, a.h);
                // Eyes
                ctx.fillStyle = "#000";
                ctx.fillRect(a.x + 5, a.y + 5, 3, 3);
                ctx.fillRect(a.x + 17, a.y + 5, 3, 3);
            }
        });

        // Alien Bullets
        ctx.fillStyle = "#ffeb3b";
        alienBullets.forEach(ab => ctx.fillRect(ab.x, ab.y, ab.w, ab.h));

        // Drops
        drops.forEach(d => {
            ctx.fillStyle = d.type === 'malus' ? "#f44336" : "#4CAF50";
            ctx.beginPath();
            ctx.arc(d.x + d.w / 2, d.y + d.h / 2, d.w / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "10px Arial";
            ctx.fillText(d.type === 'malus' ? "!" : "%", d.x + 4, d.y + 11);
        });

        if (!gameActive) {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.fillRect(0,0, canvas.width, canvas.height);
            ctx.fillStyle = "#fff";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.fillText("VOLUME CALIBRATED", canvas.width/2, canvas.height/2);
        }
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    spawnAliens();
    loop();
});
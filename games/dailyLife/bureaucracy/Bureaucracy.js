window.onload = function() {
    const audio = document.getElementById('audio');
    const mockSound = document.getElementById('mock-sound');
    
    // Phases
    const phaseForm = document.getElementById('bureaucracy-form');
    const phaseLoading = document.getElementById('bureaucracy-loading');
    const phaseResult = document.getElementById('bureaucracy-result');
    
    // Elements
    const submitBtn = document.getElementById('submit-btn');
    const resetTrapBtn = document.getElementById('reset-trap-btn');
    const reqOffice = document.getElementById('req-office');
    const reqDate = document.getElementById('req-date');
    const timeLeftDisplay = document.getElementById('time-left');
    
    // OTP
    const otpDisplay = document.getElementById('otp-display');
    const otpTimerDisplay = document.getElementById('otp-timer');
    const reqOtp = document.getElementById('req-otp');

    let currentOTP = "";
    let sessionSeconds = 90; // 1.5 minutes

    audio.volume = 0;

    // --- 1. SETUP RANDOM OFFICES ---
    function setupOffices() {
        let offices = [];
        for (let i = 1; i <= 50; i++) offices.push(`Competence Office no. ${i}`);
        
        offices.sort(() => Math.random() - 0.5);
        
        reqOffice.innerHTML = `<option value="">-- Select --</option>`;
        offices.forEach(off => {
            let val = off.includes("no. 1") ? "1" : "invalid"; 
            reqOffice.innerHTML += `<option value="${val}">${off}</option>`;
        });
    }

    // --- 2. OTP GENERATOR ---
    function generateOTP() {
        currentOTP = Math.floor(100000 + Math.random() * 900000).toString();
        otpDisplay.textContent = currentOTP;
        
        let timeLeft = 6;
        let otpInterval = setInterval(() => {
            timeLeft--;
            otpTimerDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(otpInterval);
                generateOTP(); 
            }
        }, 1000);
    }

    // --- 3. SESSION TIMER ---
    setInterval(() => {
        if (phaseForm.style.display !== 'none') {
            sessionSeconds--;
            let m = Math.floor(sessionSeconds / 60).toString().padStart(2, '0');
            let s = (sessionSeconds % 60).toString().padStart(2, '0');
            timeLeftDisplay.textContent = `${m}:${s}`;
            
            if (sessionSeconds <= 0) {
                alert("Session expired due to inactivity. The page will reload.");
                location.reload();
            }
        }
    }, 1000);

    setupOffices();
    generateOTP();

    // --- THE VISUAL TRAP ---
    resetTrapBtn.addEventListener('click', () => {
        document.querySelectorAll('.form-input').forEach(i => i.value = "");
        
        // MODIFICA: Il trombone suona perché sei caduto nella trappola visiva!
        mockSound.volume = 1; 
        mockSound.currentTime = 0;
        mockSound.play().catch(()=>{});
        localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);

        alert("You clicked 'CANCEL APPLICATION'. Form reset.");
    });

    // --- SUBMISSION AND VALIDATIONS ---
    submitBtn.addEventListener('click', () => {
        if (audio.paused) audio.play().catch(() => {});
        
        // 1. Office hours (Modificato a 30 secondi)
        let currentSecond = new Date().getSeconds();
        if (currentSecond > 30) {
            alert(`The digital offices only accept applications during the first 30 seconds of every minute. (Currently at ${currentSecond} seconds). Try again shortly.`);
            return;
        }

        // 2. Base check
        let vol = parseInt(document.getElementById('req-volume').value);
        if (isNaN(vol) || vol < 0 || vol > 100) return alert("Please enter a valid Requested Volume (0-100).");
        
        // 3. Office Check
        if (reqOffice.value !== "1") return alert("Application rejected: The selected office has no jurisdiction. Look for Competence Office no. 1 in the list.");

        // 4. Justification Check
        if (document.getElementById('req-details').value.length < 30) return alert("The detailed justification must contain at least 30 characters.");

        // 5. OTP Check
        if (reqOtp.value !== currentOTP) return alert("Security Error: The entered OTP is incorrect or expired. Try again.");

        // 6. Mandatory Date Check (Solo controllo che non sia vuota)
        if (reqDate.value === "") {
            alert("Application rejected: Appointment date is mandatory. Please select any date.");
            return;
        }

        phaseForm.style.display = 'none';
        phaseLoading.style.display = 'block';
        startBureaucracyLoading(vol);
    });

    // --- LOADING TRAP ---
    function startBureaucracyLoading(requestedVol) {
        let progress = 0;
        let loadingInterval = setInterval(() => {
            let step = Math.floor(Math.random() * 3) + 1;
            if (progress > 95 && progress < 99) step = 1; 
            else if (progress === 99) step = Math.random() > 0.95 ? 1 : 0; 
            
            progress += step;
            if (progress > 100) progress = 100;
            document.getElementById('progress-fill').style.width = progress + '%';

            if (progress === 100) {
                clearInterval(loadingInterval);
                setTimeout(() => showResult(true, requestedVol), 800);
            }
        }, 1000);

        document.getElementById('sollecita-btn').onclick = function() {
            if (Math.random() < 0.25) {
                clearInterval(loadingInterval);
                showResult(false, 0);
            } else {
                progress += 10;
                document.getElementById('progress-fill').style.width = Math.min(progress, 100) + '%';
            }
        };
    }

    // --- RESULTS ---
    function showResult(isApproved, requestedVol) {
        phaseLoading.style.display = 'none';
        phaseResult.style.display = 'block';
        const stamp = document.getElementById('stamp');
        const resultText = document.getElementById('result-text');
        const valueDisplay = document.getElementById('value');

        if (!isApproved) {
            // MODIFICA: Il trombone suona per pratica respinta.
            stamp.textContent = "APPLICATION REJECTED";
            stamp.style.color = stamp.style.borderColor = "#D32F2F";
            resultText.innerHTML = "Application <strong>CANCELLED</strong> for contempt of a digital public official following an unauthorized expedite attempt.";
            valueDisplay.textContent = `Granted Volume: 0%`;
            
            mockSound.volume = 1; 
            mockSound.currentTime = 0;
            mockSound.play();
            
            localStorage.setItem('badui_fails', parseInt(localStorage.getItem('badui_fails') || 0) + 1);
            audio.volume = 0;
        } else {
            stamp.textContent = "APPLICATION APPROVED";
            stamp.style.color = stamp.style.borderColor = "#4CAF50";
            let tax = Math.floor(Math.random() * 6) + 2; 
            let finalVol = Math.random() > 0.5 ? Math.min(100, requestedVol + tax) : Math.max(0, requestedVol - tax);
            
            if (finalVol !== requestedVol) {
                // MODIFICA: Trombone e fallimento RIMOSSI da qui!
                resultText.innerHTML = `Application for ${requestedVol}% granted.<br><br>However, due to the <em>Administrative Withholding (${tax}%)</em>, the output volume has been adjusted.`;
            } else {
                resultText.innerHTML = "Administrative miracle: Request processed without adjustments.";
            }
            valueDisplay.textContent = `Granted Volume: ${finalVol}%`;
            audio.volume = finalVol / 100;
        }
    }

    // --- APPEAL (RESTART) ---
    document.getElementById('restart-btn').addEventListener('click', () => {
        location.reload(); 
    });
}
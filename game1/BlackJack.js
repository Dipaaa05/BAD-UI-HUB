window.onload = function() {
    const volumeSlider = document.getElementById('volume');
    const audio = document.getElementById('audio');
    const mockSound = document.getElementById('mock-sound'); // Recuperiamo il suono di scherno
    const valueDisplay = document.getElementById('value');
    
    const drawBtn = document.getElementById('draw-btn');
    const resetBtn = document.getElementById('reset-btn');
    const cardsDisplay = document.getElementById('cards-display');
    const scoreDisplay = document.getElementById('score-display');

    let deck = [];
    let currentScore = 0;
    let acesCount = 0;

    // Genera un mazzo da 52 carte
    function buildDeck() {
        const suits = ['♠️', '♥️', '♦️', '♣️'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        deck = [];
        for (let suit of suits) {
            for (let rank of ranks) {
                deck.push({ rank: rank, suit: suit });
            }
        }
    }

    // Mescola il mazzo (Algoritmo Fisher-Yates)
    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    // Inizializza la mano
    function initGame() {
        buildDeck();
        shuffleDeck();
        currentScore = 0;
        acesCount = 0;
        cardsDisplay.innerHTML = '';
        updateVolume();
    }

    // Calcola il valore della carta stile Blackjack
    function getCardValue(rank) {
        if (['J', 'Q', 'K'].includes(rank)) return 10;
        if (rank === 'A') return 11;
        return parseInt(rank);
    }

    // Calcola il punteggio e imposta il volume
    function updateVolume() {
        while (currentScore > 21 && acesCount > 0) {
            currentScore -= 10;
            acesCount -= 1;
        }

        let calculatedVolume = 0;
        
        if (currentScore <= 21) {
            calculatedVolume = Math.round((currentScore / 21) * 100);
            scoreDisplay.textContent = `Score: ${currentScore}`;
        } else {
            calculatedVolume = 0; 
            scoreDisplay.textContent = `Score: ${currentScore} (Out of range!)`;
            scoreDisplay.style.color = "red";
        }

        volumeSlider.value = calculatedVolume;
        audio.volume = calculatedVolume / 100; 
        valueDisplay.textContent = `Volume: ${calculatedVolume}%`;
    }

    // Evento Pesca Carta
    drawBtn.addEventListener('click', function() {
        if (audio.paused) {
            audio.play().catch(e => console.log("Forced play prevented:", e));
        }

        // Se il mazzo è vuoto o l'utente ha già sballato, forza un reset e FERMA la funzione
        if (deck.length === 0 || currentScore > 21) {
            scoreDisplay.style.color = "black";
            initGame(); 
            return; // <-- Fondamentale per non fargli pescare un'altra carta subito dopo il reset!
        }

        const card = deck.pop();
        const cardValue = getCardValue(card.rank);

        if (card.rank === 'A') acesCount += 1;
        currentScore += cardValue;

        // Crea graficamente la carta
        const cardElement = document.createElement('div');
        const isRed = ['♥️', '♦️', '♥', '♦'].includes(card.suit);
        cardElement.className = `card ${isRed ? 'red' : 'black'}`;
        cardElement.textContent = card.rank + card.suit;
        cardsDisplay.appendChild(cardElement);

        updateVolume();

        // --- CONTROLLO SCHERNO ---
        // Se ha appena sballato, facciamo partire il trombone triste
        if (currentScore > 21) {
            mockSound.volume = 1;
            mockSound.currentTime = 0; // Fa ripartire l'audio dall'inizio
            mockSound.play();
        }
    });

    // Evento Resetta/Stai
    resetBtn.addEventListener('click', function() {
        scoreDisplay.style.color = "black";
        initGame();
    });

    // Avvia il gioco appena si carica la pagina
    audio.volume = 0;
    initGame();
}
// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set initial canvas size - actual dimensions will be maintained by CSS
canvas.width = 800;
canvas.height = 500;

// Game elements
const paddleWidth = 10;
const paddleHeight = 100;
const ballSize = 10;

// Game variables
let playerScore = 0;
let computerScore = 0;
let gameRunning = false;
let animationId;
let winScore = 10;
let winner = null;
let soundEnabled = true; // Sound is enabled by default
let currentLevel = 1;
let language = 'english';
let paddleSmoothingEnabled = true; // Paddle smoothing is enabled by default

// Dictionary for translations
const translations = {
    english: {
        you: "YOU",
        cpu: "CPU",
        level: "Level",
        controlsText: "Control with mouse movements",
        winConditionText: "First to 10 points wins!",
        startGame: "Start Game",
        pauseGame: "Pause Game",
        resumeGame: "Resume Game",
        playAgain: "Play Again",
        youWin: "YOU WIN!",
        cpuWins: "CPU WINS!",
        smoothPaddle: "Smooth Paddle",
        on: "On",
        off: "Off"
    },
    georgian: {
        you: "თქვენ",
        cpu: "CPU",
        level: "დონე",
        controlsText: "მართვა თაგუნას მოძრაობით",
        winConditionText: "პირველი 10 ქულამდე იგებს!",
        startGame: "თამაშის დაწყება",
        pauseGame: "პაუზა",
        resumeGame: "გაგრძელება",
        playAgain: "თავიდან თამაში",
        youWin: "თქვენ გაიმარჯვეთ!",
        cpuWins: "CPU გაიმარჯვა!",
        smoothPaddle: "გლუვი ჩოგანი",
        on: "ჩართ.",
        off: "გამორთ."
    }
};

// CPU difficulty settings based on level (1-10)
const difficultySettings = {
    1: { speed: 3, reactionDelay: 50 },
    2: { speed: 3.5, reactionDelay: 45 },
    3: { speed: 4, reactionDelay: 40 },
    4: { speed: 4.5, reactionDelay: 35 },
    5: { speed: 5, reactionDelay: 30 },
    6: { speed: 5.5, reactionDelay: 25 },
    7: { speed: 6, reactionDelay: 20 },
    8: { speed: 6.5, reactionDelay: 15 },
    9: { speed: 7, reactionDelay: 10 },
    10: { speed: 8, reactionDelay: 5 }
};

// Create a persistent audio context
let audioCtx = null;
// Initialize audio context on user interaction to comply with browser policies
function initAudioContext() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            soundEnabled = false;
        }
    } else if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Colors
const colors = {
    playerPaddle: '#FF5722',
    computerPaddle: '#2196F3',
    ball: '#FFFFFF',
    trail: ['#FF5722', '#FFC107', '#FFEB3B', '#CDDC39', '#8BC34A', '#4CAF50', '#009688', '#00BCD4', '#2196F3', '#3F51B5']
};

// Particles array
let particles = [];
let trails = [];
let confetti = [];

// Player paddle
const player = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: colors.playerPaddle,
    speed: 8,
    isGlowing: false,
    targetY: canvas.height / 2 - paddleHeight / 2, // Target position for smooth movement
    smoothingFactor: 0.2 // Controls how quickly paddle moves to target (0-1)
};

// Computer paddle
const computer = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    color: colors.computerPaddle,
    speed: 5,
    isGlowing: false,
    targetY: 0, // Target Y position for the computer paddle
    lastBallY: 0 // Last recorded ball Y position
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: ballSize,
    speedX: 5,
    speedY: 5,
    color: colors.ball,
    trail: []
};

// Draw functions
function drawRect(x, y, width, height, color, isGlowing = false) {
    ctx.fillStyle = color;
    
    if (isGlowing) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
    }
    
    ctx.fillRect(x, y, width, height);
    ctx.shadowBlur = 0;
}

function drawCircle(x, y, size, color) {
    ctx.fillStyle = color;
    
    // Add glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function drawNet() {
    for (let i = 0; i < canvas.height; i += 40) {
        const netColor = `rgba(255, 255, 255, ${0.5 + Math.sin(Date.now() * 0.003 + i * 0.1) * 0.5})`;
        drawRect(canvas.width / 2 - 1, i, 2, 20, netColor);
    }
}

function drawText(text, x, y, color, size = 30, align = 'center') {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px Orbitron`;
    ctx.textAlign = align;
    
    // Add glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
}

// Particle system
class Particle {
    constructor(x, y, color, speedFactor = 1) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * (Math.random() * 6) * speedFactor;
        this.speedY = (Math.random() - 0.5) * (Math.random() * 6) * speedFactor;
        this.color = color;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= this.decay;
        this.size -= this.decay * 2;
    }

    draw() {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class TrailParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = ball.size * 0.7;
        this.color = color;
        this.alpha = 0.7;
        this.decay = 0.035;
    }

    update() {
        this.alpha -= this.decay;
        this.size -= this.decay;
    }

    draw() {
        if (this.alpha <= 0) return;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class ConfettiParticle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.size = Math.random() * 10 + 5;
        this.color = colors.trail[Math.floor(Math.random() * colors.trail.length)];
        this.speedY = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.angle = Math.random() * 360;
        this.spin = Math.random() * 10 - 5;
        this.shape = Math.floor(Math.random() * 3); // 0: square, 1: circle, 2: triangle
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.angle += this.spin;
        
        // Reset if off-screen
        if (this.y > canvas.height + this.size) {
            this.y = -this.size;
            this.x = Math.random() * canvas.width;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle * Math.PI / 180);
        ctx.fillStyle = this.color;
        
        switch(this.shape) {
            case 0: // Square
                ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
                break;
            case 1: // Circle
                ctx.beginPath();
                ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 2: // Triangle
                ctx.beginPath();
                ctx.moveTo(0, -this.size/2);
                ctx.lineTo(this.size/2, this.size/2);
                ctx.lineTo(-this.size/2, this.size/2);
                ctx.closePath();
                ctx.fill();
                break;
        }
        
        ctx.restore();
    }
}

function addTrailParticle() {
    const colorIndex = Math.floor(Math.random() * colors.trail.length);
    trails.push(new TrailParticle(ball.x, ball.y, colors.trail[colorIndex]));
}

function createParticleExplosion(x, y, color, amount, speedFactor = 1) {
    for (let i = 0; i < amount; i++) {
        particles.push(new Particle(x, y, color, speedFactor));
    }
}

function createConfetti(amount = 100) {
    confetti = [];
    for (let i = 0; i < amount; i++) {
        confetti.push(new ConfettiParticle());
    }
}

// Update game elements
function update() {
    // Update confetti if there's a winner
    if (winner) {
        confetti.forEach(particle => particle.update());
        return;
    }

    // Add trail effect
    if (gameRunning && Math.random() > 0.5) {
        addTrailParticle();
    }
    
    // Update trails
    trails.forEach((particle, index) => {
        particle.update();
        if (particle.alpha <= 0) {
            trails.splice(index, 1);
        }
    });
    
    // Update particles
    particles.forEach((particle, index) => {
        particle.update();
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        }
    });

    // Apply smooth movement to player paddle based on user preference
    if (paddleSmoothingEnabled) {
        if (player.y !== player.targetY) {
            // Interpolate towards target position with smoothing
            player.y += (player.targetY - player.y) * player.smoothingFactor;
        }
    } else {
        // Directly set paddle position without smoothing
        player.y = player.targetY;
    }

    // Move ball
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Wall collision (top and bottom)
    if (ball.y - ball.size < 0 || ball.y + ball.size > canvas.height) {
        ball.speedY = -ball.speedY;
        
        // Add particles on wall collision
        createParticleExplosion(ball.x, ball.y < ball.size ? 0 : canvas.height, '#FFFFFF', 10);
        
        // Play bounce sound
        playSound('wall');
    }

    // Computer AI with difficulty settings
    updateComputerAI();

    // Check which side the ball is on
    const isOnPlayerSide = ball.x < canvas.width / 2;
    
    // Paddle collision
    const paddle = isOnPlayerSide ? player : computer;
    
    // Reset glow state
    player.isGlowing = false;
    computer.isGlowing = false;
    
    // Paddle collision check
    if (
        ball.x - ball.size < paddle.x + paddle.width &&
        ball.x + ball.size > paddle.x &&
        ball.y - ball.size < paddle.y + paddle.height &&
        ball.y + ball.size > paddle.y
    ) {
        // Set glow state for the paddle that hit the ball
        paddle.isGlowing = true;
        
        // Don't let the ball get stuck inside paddle
        if (isOnPlayerSide) {
            ball.x = player.x + player.width + ball.size;
        } else {
            ball.x = computer.x - ball.size;
        }
        
        // Reverse the x direction
        ball.speedX = -ball.speedX;
        
        // Calculate where the ball hit the paddle
        const collidePoint = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
        
        // Change angle of ball depending on where it hit the paddle
        ball.speedY = collidePoint * 6;
        
        // Slightly increase ball speed with each hit
        ball.speedX *= 1.05;
        if (Math.abs(ball.speedX) > 15) ball.speedX = (ball.speedX > 0) ? 15 : -15;
        
        // Create particle explosion
        createParticleExplosion(
            ball.x,
            ball.y,
            isOnPlayerSide ? colors.playerPaddle : colors.computerPaddle,
            20,
            1.5
        );
        
        // Play paddle hit sound
        playSound('paddle');
    }

    // Score points
    if (ball.x < 0) {
        computerScore++;
        document.getElementById('computerScore').textContent = computerScore;
        
        // Add score animation class
        const scoreElement = document.getElementById('computerScore');
        scoreElement.classList.add('score-animation');
        setTimeout(() => scoreElement.classList.remove('score-animation'), 500);
        
        // Create explosion at score position
        createParticleExplosion(0, ball.y, colors.computerPaddle, 50, 2);
        
        // Play score sound
        playSound('score');
        
        // Check for winner
        if (computerScore >= winScore) {
            endGame('computer');
            return;
        }
        
        resetBall();
    } else if (ball.x > canvas.width) {
        playerScore++;
        document.getElementById('playerScore').textContent = playerScore;
        
        // Add score animation class
        const scoreElement = document.getElementById('playerScore');
        scoreElement.classList.add('score-animation');
        setTimeout(() => scoreElement.classList.remove('score-animation'), 500);
        
        // Create explosion at score position
        createParticleExplosion(canvas.width, ball.y, colors.playerPaddle, 50, 2);
        
        // Play score sound
        playSound('score');
        
        // Check for winner
        if (playerScore >= winScore) {
            endGame('player');
            return;
        }
        
        resetBall();
    }
}

// Computer AI with difficulty-based settings
function updateComputerAI() {
    const difficulty = difficultySettings[currentLevel];
    computer.speed = difficulty.speed;
    
    // Only update target if ball is moving towards computer or based on reaction delay
    if (ball.speedX > 0 || Math.abs(ball.y - computer.lastBallY) > difficulty.reactionDelay) {
        computer.lastBallY = ball.y;
        
        // Advanced prediction based on difficulty
        // Higher levels predict more accurately where the ball will end up
        if (ball.speedX > 0) {
            // Calculate where the ball will intersect with the computer's x-position
            const distanceToComputer = computer.x - ball.x;
            const timeToReach = distanceToComputer / ball.speedX;
            let futureY = ball.y + ball.speedY * timeToReach;
            
            // Account for bounces
            const bounces = Math.floor(futureY / canvas.height);
            if (bounces % 2 === 1) {
                futureY = canvas.height - (futureY % canvas.height);
            } else {
                futureY = futureY % canvas.height;
            }
            
            // Add imperfection based on level (lower levels predict less accurately)
            const imperfectionFactor = (11 - currentLevel) / 10; // 1.0 at level 1, 0.1 at level 10
            const randomOffset = (Math.random() * 100 - 50) * imperfectionFactor;
            computer.targetY = futureY + randomOffset - computer.height / 2;
            
            // Ensure target is within bounds
            computer.targetY = Math.max(0, Math.min(canvas.height - computer.height, computer.targetY));
        } else {
            // If ball is moving away, gradually move toward center with some randomness
            const centerY = canvas.height / 2 - computer.height / 2;
            computer.targetY = centerY + (Math.random() * 100 - 50) * (1 - currentLevel / 10);
        }
    }
    
    // Move computer paddle towards the target position
    if (computer.y < computer.targetY) {
        computer.y += computer.speed;
    } else if (computer.y > computer.targetY) {
        computer.y -= computer.speed;
    }
    
    // Ensure paddle stays within canvas
    computer.y = Math.max(0, Math.min(canvas.height - computer.height, computer.y));
}

// End game and declare winner
function endGame(winnerName) {
    winner = winnerName;
    createConfetti();
    
    // Play winning sound
    playSound('win');
    
    // Update button text with current language
    const startButton = document.getElementById('startButton');
    startButton.textContent = translations[language].playAgain;
    
    // Stop game
    gameRunning = false;
    cancelAnimationFrame(animationId);
}

// Simple sound system
function playSound(type) {
    // If sound is disabled, do nothing
    if (!soundEnabled) return;
    
    // Make sure the audio context is initialized and resumed
    initAudioContext();
    
    // If audio context failed to initialize or is in wrong state, exit
    if (!audioCtx || audioCtx.state !== 'running') {
        return;
    }
    
    // Sound types with their corresponding settings
    const soundTypes = {
        paddle: { baseFreq: 220, notes: [0, 5, 7], duration: 300 },
        wall: { baseFreq: 196, notes: [0, 4], duration: 250 },
        score: { baseFreq: 330, notes: [0, 4, 7, 12], duration: 400 },
        win: { baseFreq: 262, notes: [0, 4, 7, 12, 16, 19, 24], duration: 800 }
    };
    
    try {
        // Different sound types for different game events
        switch(type) {
            case 'paddle':
                playCalmSound(audioCtx, soundTypes.paddle);
                break;
                
            case 'wall':
                playCalmSound(audioCtx, soundTypes.wall);
                break;
                
            case 'score':
                playCalmSound(audioCtx, soundTypes.score);
                break;
                
            case 'win':
                // Create a more complex winning arpeggio
                playWinSound(audioCtx, soundTypes.win);
                break;
        }
    } catch (e) {
        console.log('Error playing sound:', e);
    }
}

// Helper function to play a gentle, ambient note
function playCalmSound(audioCtx, settings) {
    const { baseFreq, notes, duration } = settings;
    
    // Create a master gain node for overall volume control
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.2; // Lower overall volume
    masterGain.connect(audioCtx.destination);
    
    // Play each note in the chord with slight delay
    notes.forEach((semitones, index) => {
        // Calculate frequency using the musical scale (A4 = 440Hz)
        const freq = baseFreq * Math.pow(2, semitones / 12);
        
        setTimeout(() => {
            // Create oscillator
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            // Create individual gain for fade in/out
            const gainNode = audioCtx.createGain();
            
            // Connect
            osc.connect(gainNode);
            gainNode.connect(masterGain);
            
            // Gentle fade in
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
            
            // Gentle fade out
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + (duration / 1000) - 0.2);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + (duration / 1000));
            
            // Start and stop
            osc.start();
            osc.stop(audioCtx.currentTime + (duration / 1000));
        }, index * 70); // Slight delay between notes for arpeggio effect
    });
}

// Special function for win sound with more complexity
function playWinSound(audioCtx, settings) {
    const { baseFreq, notes, duration } = settings;
    
    // Create a master gain node
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.2; // Lower overall volume
    masterGain.connect(audioCtx.destination);
    
    // Add reverb-like effect with delay
    const delay = audioCtx.createDelay();
    delay.delayTime.value = 0.3;
    
    const feedback = audioCtx.createGain();
    feedback.gain.value = 0.3;
    
    // Connect delay network
    masterGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(audioCtx.destination);
    
    // Play ascending arpeggio
    notes.forEach((semitones, index) => {
        const freq = baseFreq * Math.pow(2, semitones / 12);
        
        setTimeout(() => {
            // Create oscillator and gain for envelope
            const osc = audioCtx.createOscillator();
            osc.type = index % 2 === 0 ? 'sine' : 'triangle'; // Alternate waveforms
            osc.frequency.value = freq;
            
            const gainNode = audioCtx.createGain();
            
            // Connect
            osc.connect(gainNode);
            gainNode.connect(masterGain);
            
            // Gentle fade in
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
            
            // Gentle fade out
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + (duration / 1000) - 0.3);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + (duration / 1000));
            
            // Start and stop
            osc.start();
            osc.stop(audioCtx.currentTime + (duration / 1000));
        }, index * 120); // Longer delay for win sound
    });
}

// Reset ball to center
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speedX = -ball.speedX;
    ball.speedY = Math.random() * 10 - 5;
    
    // Reset trail
    trails = [];
    
    // Reset ball speed if it has become too fast
    if (Math.abs(ball.speedX) > 10) {
        ball.speedX = ball.speedX > 0 ? 5 : -5;
    }
}

// Setup enhanced mouse tracking for better paddle control
function setupMouseTracking() {
    // Track mouse movement across entire document
    document.addEventListener('mousemove', (e) => {
        if (!gameRunning || winner) return;
        
        const rect = canvas.getBoundingClientRect();
        
        // Check if mouse is within reasonable distance of canvas horizontally
        // This prevents unwanted paddle movement when mouse is far from game
        const mouseX = e.clientX;
        if (mouseX < rect.left - 100 || mouseX > rect.right + 100) return;
        
        // Calculate vertical position relative to canvas
        let mouseY;
        
        // If mouse is above canvas, position paddle at top
        if (e.clientY < rect.top) {
            mouseY = 0;
        } 
        // If mouse is below canvas, position paddle at bottom
        else if (e.clientY > rect.bottom) {
            mouseY = canvas.height;
        } 
        // If mouse is within canvas, calculate exact position
        else {
            mouseY = e.clientY - rect.top;
        }
        
        // Calculate and clamp paddle position
        let paddlePosition = mouseY - paddleHeight / 2;
        paddlePosition = Math.max(0, Math.min(canvas.height - paddleHeight, paddlePosition));
        
        // Update player target position for smooth movement
        player.targetY = paddlePosition;
    });
}

// Mouse movement
canvas.addEventListener('mousemove', (e) => {
    // Initialize audio context on user interaction
    if (gameRunning && !audioCtx) {
        initAudioContext();
    }
    
    if (!gameRunning || winner) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    
    // Calculate center position for paddle
    let paddlePosition = mouseY - paddleHeight / 2;
    
    // Clamp paddle position to ensure it stays within canvas
    // This allows the paddle to follow the mouse even when cursor is outside canvas
    paddlePosition = Math.max(0, Math.min(canvas.height - paddleHeight, paddlePosition));
    
    // Update player target position for smooth movement
    player.targetY = paddlePosition;
});

// Add touch support for mobile devices
canvas.addEventListener('touchmove', (e) => {
    // Prevent scrolling when touching the canvas
    e.preventDefault();
    
    if (!gameRunning || winner) return;
    
    // Initialize audio context on user interaction
    if (gameRunning && !audioCtx) {
        initAudioContext();
    }
    
    const rect = canvas.getBoundingClientRect();
    const touchY = e.touches[0].clientY - rect.top;
    
    // Calculate and clamp paddle position
    let paddlePosition = touchY - paddleHeight / 2;
    paddlePosition = Math.max(0, Math.min(canvas.height - paddleHeight, paddlePosition));
    
    // Update player target position for smooth movement
    player.targetY = paddlePosition;
}, { passive: false });

// Draw game
function draw() {
    // Clear canvas completely first
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill with semi-transparent background for fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw trails
    trails.forEach(particle => particle.draw());
    
    // Draw net
    drawNet();
    
    // Draw particles
    particles.forEach(particle => particle.draw());
    
    // Draw paddles with pulsing effect when game is running
    const playerGlow = player.isGlowing || (gameRunning && !winner && Math.sin(Date.now() * 0.005) > 0.7);
    const computerGlow = computer.isGlowing || (gameRunning && !winner && Math.sin(Date.now() * 0.005 + Math.PI) > 0.7);
    
    drawRect(player.x, player.y, player.width, player.height, player.color, playerGlow);
    drawRect(computer.x, computer.y, computer.width, computer.height, computer.color, computerGlow);
    
    // Draw ball
    drawCircle(ball.x, ball.y, ball.size, ball.color);
    
    // Make sure level information is displayed
    const levelText = document.getElementById('levelDisplay');
    if (levelText) {
        levelText.textContent = `${translations[language].level}: ${currentLevel}`;
        levelText.style.display = 'block';
    }
    
    // Ensure control info texts are visible
    const controlsText = document.getElementById('controlsText');
    const winConditionText = document.getElementById('winConditionText');
    
    if (controlsText && winConditionText) {
        controlsText.textContent = translations[language].controlsText;
        winConditionText.textContent = translations[language].winConditionText;
        controlsText.style.display = 'block';
        winConditionText.style.display = 'block';
    }
    
    // Draw confetti if there's a winner
    if (winner) {
        confetti.forEach(particle => particle.draw());
        
        // Draw winner message
        const winnerText = winner === 'player' ? translations[language].youWin : translations[language].cpuWins;
        const winnerColor = winner === 'player' ? colors.playerPaddle : colors.computerPaddle;
        
        // Draw background for text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 - 40, 300, 80);
        
        // Draw text with glow effect
        drawText(winnerText, canvas.width / 2, canvas.height / 2, winnerColor, 40);
    }
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// Menu navigation functions
function showScreen(screenId) {
    console.log(`Showing screen: ${screenId}`); // For debugging
    
    // Hide all screens
    document.querySelectorAll('.menu-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show the requested screen
    const targetScreen = document.getElementById(screenId);
    targetScreen.classList.add('active');
    
    // If showing game screen, ensure the canvas and all game info is visible
    if (screenId === 'gameScreen') {
        canvas.style.display = 'block';
        
        // Ensure control info and win condition text are visible
        const controlsInfo = document.querySelector('.controls-info');
        const controlsText = document.getElementById('controlsText');
        const winConditionText = document.getElementById('winConditionText');
        
        if (controlsInfo) {
            controlsInfo.style.display = 'flex';
            controlsInfo.style.visibility = 'visible';
            // Force the controls info to display at bottom
            document.getElementById('gameScreen').appendChild(controlsInfo);
        }
        
        if (controlsText) {
            controlsText.style.display = 'block';
            controlsText.style.visibility = 'visible';
        }
        
        if (winConditionText) {
            winConditionText.style.display = 'block';
            winConditionText.style.visibility = 'visible';
        }
        
        // Update text content to current language
        if (controlsText) controlsText.textContent = translations[language].controlsText;
        if (winConditionText) winConditionText.textContent = translations[language].winConditionText;
        
        // Make sure level display is updated
        document.getElementById('levelDisplay').textContent = `${translations[language].level}: ${currentLevel}`;
        
        // Make game header visible with title and menu button
        document.querySelector('.game-header').style.display = 'flex';
        
        // Resize canvas to fit properly
        resizeCanvas();
        
        // Redraw the game state
        draw();
    }
}

// Update UI text based on selected language
function updateLanguageText() {
    const text = translations[language];
    
    // Update all text elements
    document.getElementById('playerLabel').textContent = text.you;
    document.getElementById('cpuLabel').textContent = text.cpu;
    document.getElementById('levelDisplay').textContent = `${text.level}: ${currentLevel}`;
    document.getElementById('controlsText').textContent = text.controlsText;
    document.getElementById('winConditionText').textContent = text.winConditionText;
    
    // Update settings labels
    const smoothPaddleLabel = document.getElementById('smoothPaddleLabel');
    if (smoothPaddleLabel) {
        smoothPaddleLabel.textContent = text.smoothPaddle;
    }
    
    // Update setting option text
    document.querySelectorAll('.smoothing-option').forEach(option => {
        if (option.dataset.value === 'on') {
            option.textContent = text.on;
        } else {
            option.textContent = text.off;
        }
    });
    
    // Update button texts based on game state
    const startButton = document.getElementById('startButton');
    if (!gameRunning) {
        startButton.textContent = winner ? text.playAgain : text.startGame;
    } else {
        startButton.textContent = text.pauseGame;
    }
}

// Initialize event listeners for menu navigation
function initMenuListeners() {
    // Main menu buttons
    document.getElementById('startMenuBtn').addEventListener('click', () => {
        showScreen('levelMenu');
    });
    
    document.getElementById('settingsMenuBtn').addEventListener('click', () => {
        showScreen('settingsMenu');
    });
    
    // Level selection
    document.querySelectorAll('.level-button').forEach(button => {
        button.addEventListener('click', () => {
            currentLevel = parseInt(button.dataset.level);
            document.getElementById('levelDisplay').textContent = `${translations[language].level}: ${currentLevel}`;
            
            // First reset the game with new difficulty
            resetGame();
            
            // Then show the game screen
            showScreen('gameScreen');
            
            // Make sure the game canvas is visible and properly sized
            canvas.style.display = 'block';
            
            // Draw initial state
            draw();
        });
    });
    
    // Back buttons
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', () => {
            showScreen('mainMenu');
        });
    });
    
    // Menu button in game
    document.getElementById('menuButton').addEventListener('click', () => {
        pauseGame();
        showScreen('mainMenu');
    });
    
    // Start/Pause game button
    document.getElementById('startButton').addEventListener('click', () => {
        // Initialize audio context on user interaction
        initAudioContext();
        
        if (gameRunning) {
            // Stop game
            pauseGame();
        } else {
            // Start or restart game
            startGame();
        }
    });
    
    // Settings options
    document.querySelectorAll('.audio-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.audio-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            soundEnabled = option.dataset.value === 'on';
            
            // Update sound toggle icon
            const soundToggle = document.getElementById('soundToggle');
            soundToggle.innerHTML = soundEnabled ? 
                '<i class="fas fa-volume-up"></i>' : 
                '<i class="fas fa-volume-mute"></i>';
        });
    });
    
    // Paddle smoothing options
    document.querySelectorAll('.smoothing-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.smoothing-option').forEach(o => {
                o.classList.remove('active');
                o.setAttribute('aria-checked', 'false');
            });
            option.classList.add('active');
            option.setAttribute('aria-checked', 'true');
            
            paddleSmoothingEnabled = option.dataset.value === 'on';
            
            // Update player paddle smoothing factor based on setting
            player.smoothingFactor = paddleSmoothingEnabled ? 0.2 : 1.0;
        });
    });
    
    document.querySelectorAll('.language-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.language-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            language = option.dataset.value;
            updateLanguageText();
        });
    });
}

// Reset game state for new game
function resetGame() {
    playerScore = 0;
    computerScore = 0;
    document.getElementById('playerScore').textContent = "0";
    document.getElementById('computerScore').textContent = "0";
    winner = null;
    resetBall();
    
    // Apply difficulty settings
    const difficulty = difficultySettings[currentLevel];
    computer.speed = difficulty.speed;
    
    // Update level display with current language
    document.getElementById('levelDisplay').textContent = `${translations[language].level}: ${currentLevel}`;
    
    // Update UI text
    updateLanguageText();
}

// Pause the game 
function pauseGame() {
    if (gameRunning) {
        gameRunning = false;
        cancelAnimationFrame(animationId);
        document.getElementById('startButton').textContent = translations[language].resumeGame;
    }
}

// Start or restart game
function startGame() {
    // Reset scores if this is a restart
    if (winner) {
        resetGame();
    }
    
    gameRunning = true;
    
    // Create initial particles
    createParticleExplosion(canvas.width / 2, canvas.height / 2, '#FFFFFF', 30, 1.5);
    
    // Start game loop
    gameLoop();
    
    // Update button text
    document.getElementById('startButton').textContent = translations[language].pauseGame;
}

// Handle window resize
window.addEventListener('resize', () => {
    // Resize canvas to maintain aspect ratio and adjust to container size
    resizeCanvas();
    
    // Check window height for controls positioning
    positionControlsInfo();
});

// Position controls info based on window height
function positionControlsInfo() {
    const controlsInfo = document.querySelector('.controls-info');
    if (!controlsInfo) return;
    
    if (window.innerHeight < 700) {
        controlsInfo.style.position = 'absolute';
        controlsInfo.style.bottom = '10px';
        controlsInfo.style.left = '50%';
        controlsInfo.style.transform = 'translateX(-50%)';
        controlsInfo.style.width = '90%';
        controlsInfo.style.zIndex = '100';
    } else {
        controlsInfo.style.position = 'relative';
        controlsInfo.style.width = '100%';
        controlsInfo.style.transform = 'none';
        controlsInfo.style.left = '0';
    }
}

// Sound toggle functionality
const soundToggle = document.getElementById('soundToggle');
soundToggle.addEventListener('click', () => {
    // Initialize audio context on user interaction
    initAudioContext();
    
    soundEnabled = !soundEnabled;
    
    // Update icon based on sound state
    if (soundEnabled) {
        soundToggle.innerHTML = '<i class="fas fa-volume-up"></i>';
        // Play a small test sound to confirm sound is on
        playSound('wall');
    } else {
        soundToggle.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
    
    // Update the settings menu to match
    document.querySelectorAll('.audio-option').forEach(option => {
        option.classList.remove('active');
        if ((option.dataset.value === 'on' && soundEnabled) || 
            (option.dataset.value === 'off' && !soundEnabled)) {
            option.classList.add('active');
        }
    });
});

// Initialize audio context on any document interaction
document.addEventListener('click', function() {
    initAudioContext();
}, { once: true });

// Initialize the game
function init() {
    // Make sure canvas has the right dimensions
    canvas.width = 800;
    canvas.height = 500;
    
    // Resize canvas to match display size
    resizeCanvas();
    
    // Position controls info based on window height
    positionControlsInfo();
    
    // Setup event listeners for menu navigation
    initMenuListeners();
    
    // Setup document-wide mouse tracking for better paddle control
    setupMouseTracking();
    
    // Apply initial language
    updateLanguageText();
    
    // Show main menu first
    showScreen('mainMenu');
    
    // Draw initial game state
    draw();
}

// Resize canvas and game elements based on its displayed size
function resizeCanvas() {
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // Only resize if dimensions have changed and are not 0
    if ((canvas.width !== displayWidth || canvas.height !== displayHeight) && 
        displayWidth !== 0 && displayHeight !== 0) {
        
        // Update canvas internal dimensions to match display size
        const ratio = canvas.width / canvas.height;
        canvas.width = displayWidth;
        canvas.height = displayWidth / ratio;
        
        // Reposition game elements based on new dimensions
        computer.x = canvas.width - paddleWidth - 10;
        
        // Adjust other game elements based on new dimensions
        // These adjustments ensure proper scaling of game elements
        player.height = paddleHeight * (canvas.height / 500);
        computer.height = paddleHeight * (canvas.height / 500);
        ball.size = ballSize * (canvas.height / 500);
        
        // Also need to check and ensure UI elements are positioned properly
        document.querySelector('.game-header').style.display = 'flex';
        document.getElementById('levelDisplay').style.display = 'block';
        
        // Force controls info to be visible and at the bottom
        const controlsInfo = document.querySelector('.controls-info');
        if (controlsInfo) {
            controlsInfo.style.display = 'flex';
            controlsInfo.style.visibility = 'visible';
            
            // Reposition controls at the bottom if window height is small
            if (window.innerHeight < 700) {
                controlsInfo.style.position = 'absolute';
                controlsInfo.style.bottom = '10px';
                controlsInfo.style.left = '50%';
                controlsInfo.style.transform = 'translateX(-50%)';
                controlsInfo.style.width = '90%';
            }
        }
        
        // Ensure control texts are visible
        const controlsText = document.getElementById('controlsText');
        const winConditionText = document.getElementById('winConditionText');
        if (controlsText) controlsText.style.display = 'block';
        if (winConditionText) winConditionText.style.display = 'block';
        
        // Redraw the game
        draw();
    }
}

// Start the game initialization
window.addEventListener('load', init); 
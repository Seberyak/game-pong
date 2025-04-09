/**
 * Main Game class for Pong
 */
import { Ball } from '../components/Ball.js';
import { Paddle } from '../components/Paddle.js';
import { createParticleExplosion, createConfetti, TrailParticle } from '../components/Particles.js';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, WIN_SCORE, DIFFICULTY_SETTINGS } from '../utils/constants.js';
import { audioManager } from '../utils/AudioManager.js';
import { drawNet, drawBackground, drawWinMessage } from '../utils/DrawUtils.js';
import { translations } from '../utils/translations.js';

export class Game {
    constructor(canvas, uiController, audioManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.uiController = uiController;
        this.audioManager = audioManager;
        
        // Game state
        this.isRunning = false;
        this.score = { player: 0, ai: 0 };
        this.playerScore = 0;
        this.computerScore = 0;
        this.winningScore = 10;
        this.difficulty = 2; // Default medium difficulty
        this.currentLevel = 1;
        this.language = 'english';
        this.paddleSmoothing = true;
        this.ballSpeedMultiplier = 1;
        this.winner = null;
        this.controlType = 'mouse'; // Default to mouse control
        this.gameState = 'menu'; // Added gameState property
        this.lastFrameTime = 0; // Initialize lastFrameTime
        
        // Initialize game objects
        this.player = new Paddle(
            10, 
            this.height / 2 - PADDLE_HEIGHT / 2, 
            COLORS.playerPaddle, 
            false
        );
        
        this.computer = new Paddle(
            this.width - PADDLE_WIDTH - 10, 
            this.height / 2 - PADDLE_HEIGHT / 2, 
            COLORS.computerPaddle, 
            true
        );
        
        this.ball = new Ball(this.width, this.height);
        
        // Initialize particles
        this.particles = [];
        this.trails = [];
        this.confetti = [];
        
        // Now that game objects are initialized, reset the game
        this.resetGame();
        
        // Initialize controls
        this.initControls();
        
        // Setup input handlers for mouse and touch
        this.setupInputHandlers();
        
        // Animation frame reference
        this.animationId = null;
    }
    
    /**
     * Set up event handlers for mouse and touch input
     */
    setupInputHandlers() {
        // Mouse movement within canvas
        this.canvas.addEventListener('mousemove', (e) => {
            // Initialize audio context on user interaction
            if (this.isRunning) {
                this.audioManager.initAudioContext();
            }
            
            // Always use mouse for paddle control when controlType is mouse, even when not running yet
            if (this.controlType === 'mouse' && !this.isMobile()) {
                const rect = this.canvas.getBoundingClientRect();
                const mouseY = e.clientY - rect.top;
                
                // Calculate center position for paddle
                let paddlePosition = mouseY - (this.player.height / 2);
                
                // Clamp paddle position to ensure it stays within canvas
                paddlePosition = Math.max(0, Math.min(this.height - this.player.height, paddlePosition));
                
                // Update player target position for smooth movement
                this.player.targetY = paddlePosition;
                
                // If game is not running yet, still update paddle position for visual feedback
                if (!this.isRunning) {
                    this.player.y = this.player.targetY;
                    this.draw();
                }
            }
        });
        
        // Touch support for mobile devices
        this.canvas.addEventListener('touchmove', (e) => {
            // Prevent scrolling when touching the canvas
            e.preventDefault();
            
            // Initialize audio context on user interaction
            if (this.isRunning) {
                this.audioManager.initAudioContext();
            }
            
            const rect = this.canvas.getBoundingClientRect();
            const touchY = e.touches[0].clientY - rect.top;
            
            // Calculate and clamp paddle position
            let paddlePosition = touchY - (this.player.height / 2);
            paddlePosition = Math.max(0, Math.min(this.height - this.player.height, paddlePosition));
            
            // Update player target position for smooth movement
            this.player.targetY = paddlePosition;
            
            // If game is not running yet, still update paddle position for visual feedback
            if (!this.isRunning) {
                this.player.y = this.player.targetY;
                this.draw();
            }
        }, { passive: false });
        
        // Document-wide mouse tracking
        document.addEventListener('mousemove', (e) => {
            if (this.controlType !== 'mouse' || this.isMobile()) return;
            
            const rect = this.canvas.getBoundingClientRect();
            
            // Check if mouse is within reasonable distance of canvas horizontally
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
                mouseY = this.height;
            } 
            // If mouse is within canvas, calculate exact position
            else {
                mouseY = e.clientY - rect.top;
            }
            
            // Calculate and clamp paddle position
            let paddlePosition = mouseY - (this.player.height / 2);
            paddlePosition = Math.max(0, Math.min(this.height - this.player.height, paddlePosition));
            
            // Update player target position for smooth movement
            this.player.targetY = paddlePosition;
            
            // If game is not running yet, still update paddle position for visual feedback
            if (!this.isRunning) {
                this.player.y = this.player.targetY;
                this.draw();
            }
        });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }
    
    /**
     * Start or restart the game
     */
    startGame() {
        // Reset scores if this is a restart
        if (this.winner) {
            this.resetGame();
        }
        
        this.isRunning = true;
        this.gameState = 'playing'; // Set game state to playing
        
        // Initialize arrays if needed
        this.particles = this.particles || [];
        this.trails = this.trails || [];
        
        // Create initial particles
        this.particles = [...this.particles, ...createParticleExplosion(this.width / 2, this.height / 2, '#FFFFFF', 30, 1.5)];
        
        // Start game loop
        this.gameLoop();
        
        // Update button text
        const startButton = document.getElementById('startButton');
        if (startButton) {
            const langText = translations[this.language] || translations.english;
            startButton.textContent = langText.pauseGame || 'Pause';
        }
    }
    
    /**
     * Pause the game
     */
    pauseGame() {
        if (this.isRunning) {
            this.isRunning = false;
            this.gameState = 'paused';
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            
            const startButton = document.getElementById('startButton');
            if (startButton) {
                const langText = translations[this.language] || translations.english;
                startButton.textContent = langText.resumeGame || 'Resume';
            }
        }
    }
    
    /**
     * Reset game state for a new game
     */
    resetGame() {
        this.playerScore = 0;
        this.computerScore = 0;
        
        // Update score display if elements exist
        const playerScoreElement = document.getElementById('playerScore');
        const computerScoreElement = document.getElementById('computerScore');
        if (playerScoreElement) playerScoreElement.textContent = "0";
        if (computerScoreElement) computerScoreElement.textContent = "0";
        
        this.winner = null;
        this.resetBall();
        
        // Update level display with current language if element exists
        const levelDisplay = document.getElementById('levelDisplay');
        if (levelDisplay && this.language) {
            const langText = translations[this.language] || translations.english;
            levelDisplay.textContent = `${langText.level || 'Level'}: ${this.currentLevel || 1}`;
        }
    }
    
    /**
     * Reset ball position
     */
    resetBall() {
        if (this.ball && typeof this.ball.reset === 'function') {
            this.ball.reset();
        } else if (!this.ball) {
            // Create a new ball if it doesn't exist
            this.ball = new Ball(this.width, this.height);
        }
        
        // Initialize or clear trails
        this.trails = this.trails || [];
        this.trails.length = 0;
    }
    
    /**
     * End game and declare winner
     */
    endGame(winnerName) {
        this.winner = winnerName;
        
        // Initialize confetti array
        this.confetti = createConfetti(this.width, this.height);
        
        // Play winning sound if audio manager exists
        if (this.audioManager && typeof this.audioManager.playSound === 'function') {
            this.audioManager.playSound('win');
        }
        
        // Update button text with current language
        const startButton = document.getElementById('startButton');
        if (startButton) {
            const langText = translations[this.language] || translations.english;
            startButton.textContent = langText.playAgain || 'Play Again';
        }
        
        // Stop game
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Main game update logic
     */
    update(timestamp) {
        // Calculate delta time in seconds
        const deltaTime = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;

        // Update confetti if there's a winner
        if (this.winner) {
            this.confetti.forEach(particle => particle.update());
            return;
        }
        
        // Update game based on state
        if (this.gameState === 'playing') {
            // Add trail effect
            if (this.isRunning && Math.random() > 0.5) {
                this.trails.push(this.ball.addTrailParticle());
            }
            
            // Update trails
            this.trails = this.trails.filter(particle => {
                particle.update();
                return particle.alpha > 0;
            });
            
            // Update particles
            this.particles = this.particles.filter(particle => {
                particle.update();
                return particle.alpha > 0;
            });
            
            // Update player paddle position
            this.player.updatePlayerPosition(this.paddleSmoothingEnabled);
            
            // Update ball position
            this.ball.update();
            
            // Wall collision (top and bottom)
            if (this.ball.y - this.ball.size < 0 || this.ball.y + this.ball.size > this.height) {
                this.ball.speedY = -this.ball.speedY;
                
                // Add particles on wall collision
                this.particles = [
                    ...this.particles, 
                    ...createParticleExplosion(
                        this.ball.x, 
                        this.ball.y < this.ball.size ? 0 : this.height, 
                        '#FFFFFF', 
                        10
                    )
                ];
                
                // Play bounce sound
                this.audioManager.playSound('wall');
            }
            
            // Update computer AI based on ball position
            this.computer.updateAIPosition(this.ball, DIFFICULTY_SETTINGS, this.currentLevel, this.height);
            
            // Check which side the ball is on
            const isOnPlayerSide = this.ball.x < this.width / 2;
            
            // Paddle collision
            const paddle = isOnPlayerSide ? this.player : this.computer;
            
            // Reset glow state
            this.player.isGlowing = false;
            this.computer.isGlowing = false;
            
            // Check for paddle collision
            if (paddle.checkCollision(this.ball)) {
                paddle.handleCollision(this.ball);
                
                // Create particle explosion
                this.particles = [
                    ...this.particles, 
                    ...createParticleExplosion(
                        this.ball.x,
                        this.ball.y,
                        isOnPlayerSide ? COLORS.playerPaddle : COLORS.computerPaddle,
                        20,
                        1.5
                    )
                ];
                
                // Play paddle hit sound
                this.audioManager.playSound('paddle');
            }
            
            // Score points when ball goes off screen
            if (this.ball.x < 0) {
                this.computerScore++;
                document.getElementById('computerScore').textContent = this.computerScore;
                
                // Add score animation class
                const scoreElement = document.getElementById('computerScore');
                scoreElement.classList.add('score-animation');
                setTimeout(() => scoreElement.classList.remove('score-animation'), 500);
                
                // Create explosion at score position
                this.particles = [
                    ...this.particles, 
                    ...createParticleExplosion(0, this.ball.y, COLORS.computerPaddle, 50, 2)
                ];
                
                // Play score sound
                this.audioManager.playSound('score');
                
                // Check for winner
                if (this.computerScore >= WIN_SCORE) {
                    this.endGame('computer');
                    return;
                }
                
                this.resetBall();
            } else if (this.ball.x > this.width) {
                this.playerScore++;
                document.getElementById('playerScore').textContent = this.playerScore;
                
                // Add score animation class
                const scoreElement = document.getElementById('playerScore');
                scoreElement.classList.add('score-animation');
                setTimeout(() => scoreElement.classList.remove('score-animation'), 500);
                
                // Create explosion at score position
                this.particles = [
                    ...this.particles, 
                    ...createParticleExplosion(this.width, this.ball.y, COLORS.playerPaddle, 50, 2)
                ];
                
                // Play score sound
                this.audioManager.playSound('score');
                
                // Check for winner
                if (this.playerScore >= WIN_SCORE) {
                    this.endGame('player');
                    return;
                }
                
                this.resetBall();
            }
            
            // Update additional game object states
            this.updateBall(deltaTime);
            this.updatePaddle(deltaTime);
            this.updateParticles(deltaTime);
            this.updateScore();
        }
    }
    
    /**
     * Draw game elements
     */
    draw() {
        // Draw background
        drawBackground(this.ctx);
        
        // Draw trails
        this.trails.forEach(particle => particle.draw(this.ctx));
        
        // Draw net
        drawNet(this.ctx, this.height);
        
        // Draw particles
        this.particles.forEach(particle => particle.draw(this.ctx));
        
        // Draw paddles with pulsing effect when game is running
        const playerGlow = this.player.isGlowing || (this.isRunning && !this.winner && Math.sin(Date.now() * 0.005) > 0.7);
        const computerGlow = this.computer.isGlowing || (this.isRunning && !this.winner && Math.sin(Date.now() * 0.005 + Math.PI) > 0.7);
        
        this.player.isGlowing = playerGlow;
        this.computer.isGlowing = computerGlow;
        
        this.player.draw(this.ctx);
        this.computer.draw(this.ctx);
        
        // Draw ball
        this.ball.draw(this.ctx);
        
        // Make sure level information is displayed
        const levelText = document.getElementById('levelDisplay');
        if (levelText) {
            levelText.textContent = `${translations[this.language].level}: ${this.currentLevel}`;
            levelText.style.display = 'block';
        }
        
        // Ensure control info texts are visible
        const controlsText = document.getElementById('controlsText');
        const winConditionText = document.getElementById('winConditionText');
        
        if (controlsText && winConditionText) {
            controlsText.textContent = translations[this.language].controlsText;
            winConditionText.textContent = translations[this.language].winConditionText;
            controlsText.style.display = 'block';
            winConditionText.style.display = 'block';
        }
        
        // Draw confetti if there's a winner
        if (this.winner) {
            this.confetti.forEach(particle => particle.draw(this.ctx));
            
            // Draw winner message
            const winnerText = this.winner === 'player' ? 
                translations[this.language].youWin : 
                translations[this.language].cpuWins;
            const winnerColor = this.winner === 'player' ? 
                COLORS.playerPaddle : 
                COLORS.computerPaddle;
            
            drawWinMessage(this.ctx, winnerText, winnerColor);
        }
    }
    
    /**
     * Update ball with physics based on delta time
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updateBall(deltaTime) {
        // Apply any time-based physics updates
        // The basic position updates already happen in this.ball.update()
        
        // Adjust speed based on difficulty if needed
        if (this.ballSpeedMultiplier !== 1) {
            const currentSpeedX = this.ball.speedX;
            const currentSpeedY = this.ball.speedY;
            
            // Apply multiplier but keep the direction
            this.ball.speedX = Math.sign(currentSpeedX) * Math.abs(currentSpeedX) * this.ballSpeedMultiplier;
            this.ball.speedY = Math.sign(currentSpeedY) * Math.abs(currentSpeedY) * this.ballSpeedMultiplier;
        }
    }
    
    /**
     * Update paddle positions with physics based on delta time
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updatePaddle(deltaTime) {
        // Apply any time-based updates to paddles
        // Basic movement already handled in updatePlayerPosition and updateAIPosition
        
        // Keep paddles within canvas boundaries
        this.player.y = Math.max(0, Math.min(this.height - this.player.height, this.player.y));
        this.computer.y = Math.max(0, Math.min(this.height - this.computer.height, this.computer.y));
    }
    
    /**
     * Update particles with time-based physics
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updateParticles(deltaTime) {
        // Additional particle physics updates not covered in the main update
        // Most particle updates are handled directly in the update method
    }
    
    /**
     * Update score display
     */
    updateScore() {
        // Update score display elements if needed
        const playerScoreEl = document.getElementById('playerScore');
        const computerScoreEl = document.getElementById('computerScore');
        
        if (playerScoreEl) {
            playerScoreEl.textContent = this.playerScore;
        }
        
        if (computerScoreEl) {
            computerScoreEl.textContent = this.computerScore;
        }
    }
    
    /**
     * Main game loop
     */
    gameLoop(timestamp) {
        if (!this.isRunning) return;
        
        // Initialize lastFrameTime if this is the first frame
        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
            // Ensure canvas is properly sized on first frame
            this.resizeCanvas();
        }
        
        this.update(timestamp);
        this.draw();
        this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    /**
     * Resize canvas to maintain aspect ratio
     */
    resizeCanvas() {
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        // Only resize if dimensions have changed and are not 0
        if ((this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) && 
            displayWidth !== 0 && displayHeight !== 0) {
            
            // Update canvas internal dimensions to match display size
            const ratio = this.width / this.height;
            this.canvas.width = displayWidth;
            this.canvas.height = displayWidth / ratio;
            
            // Update internal size properties
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            
            // Update positions and sizes
            const scale = this.height / CANVAS_HEIGHT;
            
            // Reposition computer paddle
            this.computer.x = this.width - PADDLE_WIDTH - 10;
            
            // Resize game elements
            this.player.resize(this.height, scale);
            this.computer.resize(this.height, scale);
            this.ball.resize(scale);
            
            // Update UI element visibility
            this.ensureUIVisibility();
            
            // Redraw the game
            this.draw();
        }
    }
    
    /**
     * Make sure UI elements are visible
     */
    ensureUIVisibility() {
        document.querySelector('.game-header').style.display = 'flex';
        document.getElementById('levelDisplay').style.display = 'block';
        
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
        
        const controlsText = document.getElementById('controlsText');
        const winConditionText = document.getElementById('winConditionText');
        if (controlsText) controlsText.style.display = 'block';
        if (winConditionText) winConditionText.style.display = 'block';
    }
    
    /**
     * Set the current language
     */
    setLanguage(language) {
        this.language = language;
    }
    
    /**
     * Set the current difficulty level
     */
    setLevel(level) {
        this.currentLevel = level;
    }
    
    /**
     * Set paddle smoothing
     */
    setPaddleSmoothing(enabled) {
        this.paddleSmoothingEnabled = enabled;
        
        // Make sure the player paddle has the correct smoothing factor
        if (this.player) {
            this.player.smoothingFactor = enabled ? 0.2 : 1.0;
        }
        
        // Redraw the game to reflect the change
        this.draw();
    }

    initControls() {
        // Keyboard controls - always initialize these for accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                this.player.isMovingUp = true;
            }
            if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
                this.player.isMovingDown = true;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                this.player.isMovingUp = false;
            }
            if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
                this.player.isMovingDown = false;
            }
        });

        // Mobile touch controls - only visible on mobile devices
        const upButton = document.getElementById('upButton');
        const downButton = document.getElementById('downButton');

        if (upButton && downButton) {
            // Touch events for up button
            upButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.player.isMovingUp = true;
            });
            
            upButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.player.isMovingUp = false;
            });
            
            // Touch events for down button
            downButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.player.isMovingDown = true;
            });
            
            downButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.player.isMovingDown = false;
            });
        }
        
        // Set control type display based on device
        this.updateControlTypeDisplay();
    }

    /**
     * Update the control info display based on device type and settings
     */
    updateControlTypeDisplay() {
        const isMobileDevice = this.isMobile();
        const controlsInfo = document.querySelector('.controls-info');
        const controlText = document.querySelector('.controls-info p');
        const controlOptions = document.querySelectorAll('.control-option');
        
        // On mobile devices, hide keyboard/mouse control options and always show touch controls
        if (isMobileDevice) {
            // Hide the controls info text as mobile uses visible buttons
            if (controlsInfo) {
                controlsInfo.style.display = 'none';
            }
            
            // Hide control type options in settings
            controlOptions.forEach(option => {
                option.parentElement.parentElement.style.display = 'none';
            });
        } else {
            // On desktop, show the appropriate control info text based on selected control type
            if (controlsInfo) {
                controlsInfo.style.display = 'flex';
            }
            
            if (controlText) {
                if (this.controlType === 'mouse') {
                    controlText.innerHTML = 'Use <span class="key">mouse</span> to move paddle';
                } else {
                    controlText.innerHTML = 'Use <span class="key">W</span>/<span class="key">S</span> keys or <span class="key">↑</span>/<span class="key">↓</span> to move';
                }
            }
            
            // Show control type options in settings
            controlOptions.forEach(option => {
                option.parentElement.parentElement.style.display = 'block';
            });
        }
    }

    /**
     * Check if the user is on a mobile device
     * @returns {boolean} True if user is on mobile device
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    }

    // Resize game elements based on canvas size
    resizeGameElements() {
        // Store the original dimensions
        const originalWidth = 800;
        const originalHeight = 500;
        
        // Calculate scale factors
        const scaleX = this.canvas.width / originalWidth;
        const scaleY = this.canvas.height / originalHeight;
        
        // Resize and reposition paddles
        this.player.width = Math.round(this.player.width * scaleX);
        this.player.height = Math.round(this.player.height * scaleY);
        this.player.x = Math.round(this.player.x * scaleX);
        
        this.computer.width = Math.round(this.computer.width * scaleX);
        this.computer.height = Math.round(this.computer.height * scaleY);
        this.computer.x = this.canvas.width - this.computer.width - Math.round(10 * scaleX);
        
        // Resize and reposition ball
        this.ball.radius = Math.round(this.ball.radius * ((scaleX + scaleY) / 2));
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        
        // Adjust speed values for the new dimensions
        this.ball.maxSpeed = Math.round(this.ball.maxSpeed * ((scaleX + scaleY) / 2));
        this.player.speed = Math.round(this.player.speed * scaleY);
        this.computer.speed = Math.round(this.computer.speed * scaleY);
        
        // Draw the game in the new dimensions
        this.draw();
    }

    /**
     * Stop the game completely (used when returning to main menu)
     */
    stopGame() {
        this.isRunning = false;
        this.gameState = 'menu';
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Reset game state
        this.resetBall();
        
        // Make sure player paddles are stationary
        this.player.isMovingUp = false;
        this.player.isMovingDown = false;
    }

    /**
     * Set the control type (mouse or keyboard)
     */
    setControlType(type) {
        if (type === 'mouse' || type === 'keyboard') {
            this.controlType = type;
            
            // Update the control info text
            const controlsInfo = document.querySelector('.controls-info p');
            if (controlsInfo) {
                if (type === 'mouse') {
                    controlsInfo.innerHTML = 'Use <span class="key">mouse</span> to move paddle';
                } else {
                    controlsInfo.innerHTML = 'Use <span class="key">W</span>/<span class="key">S</span> keys or <span class="key">↑</span>/<span class="key">↓</span> to move';
                }
            }
            
            // Update canvas aria-label for accessibility
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                if (type === 'mouse') {
                    canvas.setAttribute('aria-label', 'Pong game canvas. Use mouse to control the left paddle.');
                } else {
                    canvas.setAttribute('aria-label', 'Pong game canvas. Use W/S or arrow keys to control the left paddle.');
                }
            }
            
            // Redraw the game to reflect the control change
            this.draw();
        }
    }
} 
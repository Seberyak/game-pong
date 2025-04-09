/**
 * UI Controller for Pong game
 */
import { translations } from '../utils/translations.js';
import { audioManager } from '../utils/AudioManager.js';

export class UIController {
    constructor() {
        this.language = 'english';
        this.soundEnabled = true;
        this.paddleSmoothingEnabled = true;
        this.controlType = 'mouse'; // Default to mouse control
        
        // Initialize screens map with the correct IDs from HTML
        this.screens = {
            mainMenu: document.getElementById('mainMenu'),
            levelMenu: document.getElementById('levelMenu'),
            settingsMenu: document.getElementById('settingsMenu'),
            gameScreen: document.getElementById('gameScreen')
        };
        
        // iOS standalone detection
        this.isStandalone = window.navigator.standalone || 
                           window.matchMedia('(display-mode: standalone)').matches;
        
        // Check if we should show the iOS prompt
        this.checkIOSPrompt();
        
        // Show main menu first
        this.showScreen('mainMenu');
        
        // Apply initial language
        this.updateLanguageText();
    }
    
    /**
     * Initialize event listeners for menu navigation
     */
    initMenuListeners(game) {
        if (!game) {
            console.error('Game instance not provided to initMenuListeners');
            return;
        }
        
        this.game = game;
        
        // Main menu buttons
        const startMenuBtn = document.getElementById('startMenuBtn');
        if (startMenuBtn) {
            startMenuBtn.addEventListener('click', () => {
                this.showScreen('levelMenu');
            });
        }
        
        const settingsMenuBtn = document.getElementById('settingsMenuBtn');
        if (settingsMenuBtn) {
            settingsMenuBtn.addEventListener('click', () => {
                this.showScreen('settingsMenu');
            });
        }
        
        // Level selection
        document.querySelectorAll('.level-button').forEach(button => {
            button.addEventListener('click', () => {
                const level = parseInt(button.dataset.level);
                game.setLevel(level);
                
                const levelDisplay = document.getElementById('levelDisplay');
                if (levelDisplay) {
                    levelDisplay.textContent = `${translations[this.language].level}: ${level}`;
                }
                
                // First reset the game with new difficulty
                game.resetGame();
                
                // Then show the game screen
                this.showScreen('gameScreen');
                
                // Make sure the game canvas is visible and properly sized
                const gameCanvas = document.getElementById('gameCanvas');
                if (gameCanvas) {
                    gameCanvas.style.display = 'block';
                }
                
                // Resize canvas to fit new container
                game.resizeCanvas();
                
                // Draw initial state
                game.draw();
            });
        });
        
        // Back buttons
        document.querySelectorAll('.back-button').forEach(button => {
            button.addEventListener('click', () => {
                this.showScreen('mainMenu');
            });
        });
        
        // Menu button in game
        const menuButton = document.getElementById('menuButton');
        if (menuButton) {
            menuButton.addEventListener('click', () => {
                game.pauseGame();
                this.showScreen('mainMenu');
            });
        }
        
        // Start/Pause game button
        const startButton = document.getElementById('startButton');
        if (startButton) {
            startButton.addEventListener('click', () => {
                // Initialize audio context on user interaction
                audioManager.initAudioContext();
                
                this.toggleGameRunning(game);
            });
        }
        
        // Settings options - Audio
        document.querySelectorAll('.audio-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.audio-option').forEach(o => {
                    o.classList.remove('active');
                    o.setAttribute('aria-checked', 'false');
                });
                option.classList.add('active');
                option.setAttribute('aria-checked', 'true');
                
                this.soundEnabled = option.dataset.value === 'on';
                audioManager.setSoundEnabled(this.soundEnabled);
                
                // Update sound toggle icon
                const soundToggle = document.getElementById('muteButton');
                if (soundToggle) {
                    soundToggle.innerHTML = this.soundEnabled ? 
                        '<i class="fas fa-volume-up"></i>' : 
                        '<i class="fas fa-volume-mute"></i>';
                }
            });
        });
        
        // Settings options - Paddle smoothing
        document.querySelectorAll('.smoothing-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.smoothing-option').forEach(o => {
                    o.classList.remove('active');
                    o.setAttribute('aria-checked', 'false');
                });
                option.classList.add('active');
                option.setAttribute('aria-checked', 'true');
                
                this.paddleSmoothingEnabled = option.dataset.value === 'on';
                game.setPaddleSmoothing(this.paddleSmoothingEnabled);
            });
        });
        
        // Settings options - Language
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.language-option').forEach(o => {
                    o.classList.remove('active');
                    o.setAttribute('aria-checked', 'false');
                });
                option.classList.add('active');
                option.setAttribute('aria-checked', 'true');
                
                this.language = option.dataset.value;
                game.setLanguage(this.language);
                this.updateLanguageText();
            });
        });
        
        // Settings options - Control Type
        document.querySelectorAll('.control-option').forEach(option => {
            option.addEventListener('click', () => {
                // Get the control type value from the data attribute
                const controlType = option.dataset.value;
                
                // Only proceed if the value is valid and different from current setting
                if ((controlType === 'mouse' || controlType === 'keyboard') && 
                    controlType !== game.controlType) {
                    
                    // Clear active class from all options
                    document.querySelectorAll('.control-option').forEach(o => {
                        o.classList.remove('active');
                        o.setAttribute('aria-checked', 'false');
                    });
                    
                    // Set active class on the selected option
                    option.classList.add('active');
                    option.setAttribute('aria-checked', 'true');
                    
                    // Update the game's control type
                    game.setControlType(controlType);
                    
                    // Play a sound effect for feedback
                    audioManager.playSound('ui');
                }
            });
        });
        
        // Sound toggle button
        const muteButton = document.getElementById('muteButton');
        if (muteButton) {
            muteButton.addEventListener('click', () => {
                this.toggleSound(game);
            });
        }
        
        // Initialize audio context on any document interaction
        document.addEventListener('click', function() {
            audioManager.initAudioContext();
        }, { once: true });
    }

    /**
     * Toggle game running state
     */
    toggleGameRunning(game) {
        if (game.isRunning) {
            game.pauseGame();
        } else {
            game.startGame();
        }
    }
    
    /**
     * Toggle sound on/off
     */
    toggleSound(game) {
        // Initialize audio context on user interaction
        audioManager.initAudioContext();
        
        this.soundEnabled = audioManager.toggleSound();
        
        // Update icon based on sound state
        const muteButton = document.getElementById('muteButton');
        if (muteButton) {
            if (this.soundEnabled) {
                muteButton.innerHTML = '<i class="fas fa-volume-up"></i>';
                // Play a small test sound to confirm sound is on
                audioManager.playSound('wall');
            } else {
                muteButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
            }
        }
        
        // Update the settings menu to match
        document.querySelectorAll('.audio-option').forEach(option => {
            option.classList.remove('active');
            if ((option.dataset.value === 'on' && this.soundEnabled) || 
                (option.dataset.value === 'off' && !this.soundEnabled)) {
                option.classList.add('active');
            }
        });
    }
    
    /**
     * Initialize all events, called after game instance is created
     */
    initEvents(game) {
        if (!game) {
            console.error('Game instance not provided to initEvents');
            return;
        }
        
        // Now that we have the game instance, initialize menu listeners
        this.initMenuListeners(game);
        
        // Detect iOS/Safari for specific optimizations
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isIOS || isSafari) {
            // Apply iOS/Safari specific fixes
            document.querySelectorAll('button').forEach(button => {
                // Add click delay removal for iOS
                button.addEventListener('touchstart', function() {}, {passive: true});
            });
            
            // Fix for iOS audio context
            document.addEventListener('touchend', () => {
                // Resume audio context if it's suspended
                if (game.audioManager && game.audioManager.context && 
                    game.audioManager.context.state === 'suspended') {
                    game.audioManager.context.resume();
                }
            }, {once: true});
        }
    }
    
    /**
     * Show a specific screen and hide others
     */
    showScreen(screenId) {
        console.log(`Showing screen: ${screenId}`); // For debugging
        
        // If we're leaving the game screen, make sure to stop the game
        if (this.game && document.getElementById('gameScreen').classList.contains('active') && screenId !== 'gameScreen') {
            this.game.stopGame();
        }
        
        // Hide all screens
        document.querySelectorAll('.menu-screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show the requested screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        } else {
            console.error(`Screen with ID "${screenId}" not found`);
            return;
        }
        
        // If showing game screen, ensure the canvas and all game info is visible
        if (screenId === 'gameScreen' && this.game) {
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                canvas.style.display = 'block';
            }
            
            // Ensure control info and win condition text are visible
            const controlsInfo = document.querySelector('.controls-info');
            if (controlsInfo) {
                controlsInfo.style.display = 'flex';
                controlsInfo.style.visibility = 'visible';
                // Force the controls info to display at bottom
                const gameScreen = document.getElementById('gameScreen');
                if (gameScreen) gameScreen.appendChild(controlsInfo);
            }
            
            const controlsText = document.getElementById('controlsText');
            if (controlsText) {
                controlsText.style.display = 'block';
                controlsText.style.visibility = 'visible';
                if (translations[this.language]) {
                    controlsText.textContent = translations[this.language].controlsText;
                }
            }
            
            const winConditionText = document.getElementById('winConditionText');
            if (winConditionText) {
                winConditionText.style.display = 'block';
                winConditionText.style.visibility = 'visible';
                if (translations[this.language]) {
                    winConditionText.textContent = translations[this.language].winConditionText;
                }
            }
            
            // Make sure level display is updated
            if (this.game.currentLevel) {
                const levelDisplay = document.getElementById('levelDisplay');
                if (levelDisplay && translations[this.language]) {
                    levelDisplay.textContent = `${translations[this.language].level}: ${this.game.currentLevel}`;
                }
            }
            
            // Make game header visible with title and menu button
            const gameHeader = document.querySelector('.game-header');
            if (gameHeader) {
                gameHeader.style.display = 'flex';
            }
            
            // Position controls based on window height
            this.positionControlsInfo();
            
            // Resize canvas to fit properly
            if (typeof this.game.resizeCanvas === 'function') {
                this.game.resizeCanvas();
            }
            
            // Reset scores display
            const playerScore = document.getElementById('playerScore');
            const computerScore = document.getElementById('computerScore');
            
            if (playerScore) playerScore.textContent = this.game.playerScore || 0;
            if (computerScore) computerScore.textContent = this.game.computerScore || 0;
        }
    }
    
    /**
     * Update UI text based on selected language
     */
    updateLanguageText() {
        const text = translations[this.language];
        
        try {
            // Update player/CPU labels if they exist
            const playerLabel = document.getElementById('playerLabel');
            if (playerLabel) playerLabel.textContent = text.you;
            
            const cpuLabel = document.getElementById('cpuLabel');
            if (cpuLabel) cpuLabel.textContent = text.cpu;
            
            // Update level display only if game is available
            const levelDisplay = document.getElementById('levelDisplay');
            if (levelDisplay) {
                const level = this.game && this.game.currentLevel ? this.game.currentLevel : 1;
                levelDisplay.textContent = `${text.level}: ${level}`;
            }
            
            // Update control text elements based on current control type
            const controlsText = document.getElementById('controlsText');
            if (controlsText) {
                if (this.controlType === 'mouse') {
                    controlsText.textContent = text.controlsText;
                } else if (this.controlType === 'keyboard') {
                    controlsText.textContent = text.keyboardControlsText || "Use arrow keys to move paddle";
                }
            }
            
            const winConditionText = document.getElementById('winConditionText');
            if (winConditionText) winConditionText.textContent = text.winConditionText;
            
            // Update settings labels
            const smoothPaddleLabel = document.getElementById('smoothPaddleLabel');
            if (smoothPaddleLabel) {
                smoothPaddleLabel.textContent = text.smoothPaddle;
            }
            
            const audioLabel = document.getElementById('audioLabel');
            if (audioLabel) {
                audioLabel.textContent = text.audio;
            }
            
            const controlTypeLabel = document.getElementById('controlTypeLabel');
            if (controlTypeLabel) {
                controlTypeLabel.textContent = text.controlType;
            }
            
            const languageLabel = document.getElementById('languageLabel');
            if (languageLabel) {
                languageLabel.textContent = text.language || 'Language';
            }
            
            // Update menu titles
            const settingsTitle = document.querySelector('#settingsMenu .menu-title');
            if (settingsTitle) {
                settingsTitle.textContent = text.settings;
            }
            
            const levelMenuTitle = document.querySelector('#levelMenu .menu-title');
            if (levelMenuTitle) {
                levelMenuTitle.textContent = text.selectLevel;
            }
            
            // Update setting option text
            document.querySelectorAll('.smoothing-option').forEach(option => {
                if (option.dataset.value === 'on') {
                    option.textContent = text.on;
                } else {
                    option.textContent = text.off;
                }
            });
            
            document.querySelectorAll('.audio-option').forEach(option => {
                if (option.dataset.value === 'on') {
                    option.textContent = text.on;
                } else {
                    option.textContent = text.off;
                }
            });
            
            document.querySelectorAll('.control-option').forEach(option => {
                if (option.dataset.value === 'mouse') {
                    option.textContent = text.mouse;
                } else if (option.dataset.value === 'keyboard') {
                    option.textContent = text.keyboard;
                }
            });
            
            // Update button texts based on game state
            const startButton = document.getElementById('startButton');
            if (startButton) {
                if (!this.game || !this.game.isRunning) {
                    startButton.textContent = this.game && this.game.winner ? text.playAgain : text.startGame;
                } else {
                    startButton.textContent = text.pauseGame;
                }
            }
            
            // Update menu buttons
            const startMenuBtn = document.getElementById('startMenuBtn');
            if (startMenuBtn) startMenuBtn.textContent = text.startGame;
            
            const settingsMenuBtn = document.getElementById('settingsMenuBtn');
            if (settingsMenuBtn) settingsMenuBtn.textContent = text.settings;
            
            // Update back buttons
            document.querySelectorAll('.back-button').forEach(button => {
                button.textContent = text.back || 'Back';
            });
        } catch (error) {
            console.warn('Error updating language text:', error);
        }
    }
    
    /**
     * Position controls info based on window height
     */
    positionControlsInfo() {
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

    // Fixes for iOS height calculation issues
    fixIOSHeight() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOS) {
            // Fix for iOS 100vh issue
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // Update on resize/orientation change
            window.addEventListener('resize', () => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
            });
        }
    }

    checkIOSPrompt() {
        // Disabled - we don't want to show the iOS prompt
        const iosPrompt = document.getElementById('iosPrompt');
        if (iosPrompt) {
            iosPrompt.classList.remove('visible');
            localStorage.setItem('iosPromptDismissed', 'true');
        }
    }
} 
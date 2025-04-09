/**
 * Main entry point for the Pong game
 */
import { Game } from './core/Game.js';
import { UIController } from './core/UIController.js';
import { audioManager } from './utils/AudioManager.js';

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Prevent elastic scrolling on iOS
    document.addEventListener('touchmove', (e) => {
        // If we're on a game screen, prevent scrolling
        if (document.getElementById('gameScreen').classList.contains('active')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Prevent scroll refresh on mobile by stopping touchstart at the document level
    document.addEventListener('touchstart', (e) => {
        if (e.target.tagName !== 'CANVAS' && e.target.tagName !== 'BUTTON') {
            e.preventDefault();
        }
    }, { passive: false });
    
    console.log('Initializing Pong game...');
    
    // Get references to key elements
    const canvas = document.getElementById('gameCanvas');
    const uiController = new UIController();
    
    // We already imported the audioManager singleton instance
    // No need to create a new instance with "new AudioManager()"
    
    // Apply iOS-specific fixes
    uiController.fixIOSHeight();
    
    // Define the resizeCanvas function with a game parameter
    function resizeCanvas(gameInstance = null) {
        const gameContainer = document.querySelector('.game-container');
        
        if (gameContainer) {
            const maxWidth = Math.min(800, gameContainer.clientWidth - 20);
            const aspectRatio = 5/3; // Original is 800x500, or 8:5 ratio
            const calculatedHeight = maxWidth / aspectRatio;
            
            canvas.width = maxWidth;
            canvas.height = calculatedHeight;
            
            // If game instance is provided, update its dimensions
            if (gameInstance) {
                gameInstance.width = canvas.width;
                gameInstance.height = canvas.height;
                gameInstance.resizeGameElements();
            }
        }
    }
    
    // Initial canvas size (without game instance)
    resizeCanvas();
    
    // Initialize game
    const game = new Game(canvas, uiController, audioManager);
    
    // Set default control type based on device
    // If it's a desktop device, default to keyboard controls
    if (!game.isMobile()) {
        game.setControlType('keyboard');
    }
    
    // Handle window resize
    window.addEventListener('resize', () => resizeCanvas(game));
    
    // Handle orientation change
    window.addEventListener('orientationchange', () => {
        // Add small delay to ensure screen dimensions have updated
        setTimeout(() => resizeCanvas(game), 100);
    });
    
    // Initialize UI controller events
    uiController.initEvents(game);
    
    console.log('Game initialized successfully!');
}); 
/**
 * Game constants and configuration
 */

// Game dimensions
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 100;
export const BALL_SIZE = 10;

// Game settings
export const WIN_SCORE = 10;

// Colors
export const COLORS = {
    playerPaddle: '#FF5722',
    computerPaddle: '#2196F3',
    ball: '#FFFFFF',
    trail: ['#FF5722', '#FFC107', '#FFEB3B', '#CDDC39', '#8BC34A', '#4CAF50', '#009688', '#00BCD4', '#2196F3', '#3F51B5']
};

// CPU difficulty settings
export const DIFFICULTY_SETTINGS = {
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
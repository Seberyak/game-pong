/**
 * Paddle component for the Pong game
 */
import { PADDLE_WIDTH, PADDLE_HEIGHT } from '../utils/constants.js';

export class Paddle {
    constructor(x, y, color, isComputer = false) {
        this.x = x;
        this.y = y;
        this.width = PADDLE_WIDTH;
        this.height = PADDLE_HEIGHT;
        this.color = color;
        this.speed = isComputer ? 5 : 8;
        this.isGlowing = false;
        this.isComputer = isComputer;
        
        // Movement flags for keyboard control
        this.isMovingUp = false;
        this.isMovingDown = false;
        
        // For AI paddle
        this.targetY = y;
        this.lastBallY = 0;
        
        // Default maximum Y position (will be updated on resize)
        this.maxY = 500 - this.height;
        
        // For player paddle with smooth movement
        if (!isComputer) {
            this.smoothingFactor = 0.2;
        }
    }

    /**
     * Draw the paddle on the canvas
     */
    draw(ctx) {
        ctx.fillStyle = this.color;
        
        if (this.isGlowing) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
        }
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    /**
     * Move the player paddle smoothly toward its target position
     * or respond to keyboard movement flags
     */
    updatePlayerPosition(paddleSmoothingEnabled) {
        let moved = false;
        
        // Handle keyboard-based movement (isMovingUp and isMovingDown flags)
        if (this.isMovingUp) {
            this.y -= this.speed;
            moved = true;
        }
        if (this.isMovingDown) {
            this.y += this.speed;
            moved = true;
        }
        
        // Ensure paddle stays within canvas bounds
        this.y = Math.max(0, Math.min(this.maxY || 500 - this.height, this.y));
        
        // If we moved with keyboard, update target position to current position
        // This prevents paddle from resetting when keys are released
        if (moved) {
            this.targetY = this.y;
            return; // Exit early to give priority to keyboard controls
        }
        // Only apply mouse-based positioning if we haven't moved with keyboard
        else if (this.targetY !== undefined) {
            if (paddleSmoothingEnabled) {
                // Interpolate towards target position with smoothing
                this.y += (this.targetY - this.y) * this.smoothingFactor;
            } else {
                // Direct positioning without smoothing
                this.y = this.targetY;
            }
        }
    }

    /**
     * Update the computer paddle position using AI
     */
    updateAIPosition(ball, difficultySettings, currentLevel, canvasHeight) {
        const difficulty = difficultySettings[currentLevel];
        this.speed = difficulty.speed;
        
        // Only update target if ball is moving towards computer or based on reaction delay
        if (ball.speedX > 0 || Math.abs(ball.y - this.lastBallY) > difficulty.reactionDelay) {
            this.lastBallY = ball.y;
            
            // Advanced prediction based on difficulty
            if (ball.speedX > 0) {
                // Calculate where the ball will intersect with the computer's x-position
                const distanceToComputer = this.x - ball.x;
                const timeToReach = distanceToComputer / ball.speedX;
                let futureY = ball.y + ball.speedY * timeToReach;
                
                // Account for bounces
                const bounces = Math.floor(futureY / canvasHeight);
                if (bounces % 2 === 1) {
                    futureY = canvasHeight - (futureY % canvasHeight);
                } else {
                    futureY = futureY % canvasHeight;
                }
                
                // Add imperfection based on level (lower levels predict less accurately)
                const imperfectionFactor = (11 - currentLevel) / 10;
                const randomOffset = (Math.random() * 100 - 50) * imperfectionFactor;
                this.targetY = futureY + randomOffset - this.height / 2;
                
                // Ensure target is within bounds
                this.targetY = Math.max(0, Math.min(canvasHeight - this.height, this.targetY));
            } else {
                // If ball is moving away, gradually move toward center with some randomness
                const centerY = canvasHeight / 2 - this.height / 2;
                this.targetY = centerY + (Math.random() * 100 - 50) * (1 - currentLevel / 10);
            }
        }
        
        // Move computer paddle towards the target position
        if (this.y < this.targetY) {
            this.y += this.speed;
        } else if (this.y > this.targetY) {
            this.y -= this.speed;
        }
        
        // Ensure paddle stays within canvas
        this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
    }

    /**
     * Check if ball collides with this paddle
     */
    checkCollision(ball) {
        return (
            ball.x - ball.size < this.x + this.width &&
            ball.x + ball.size > this.x &&
            ball.y - ball.size < this.y + this.height &&
            ball.y + ball.size > this.y
        );
    }

    /**
     * Handle collision resolution and ball direction change
     */
    handleCollision(ball) {
        this.isGlowing = true;
        
        // Don't let the ball get stuck inside paddle
        if (!this.isComputer) {
            ball.x = this.x + this.width + ball.size;
        } else {
            ball.x = this.x - ball.size;
        }
        
        // Reverse the x direction
        ball.speedX = -ball.speedX;
        
        // Calculate where the ball hit the paddle
        const collidePoint = (ball.y - (this.y + this.height / 2)) / (this.height / 2);
        
        // Change angle of ball depending on where it hit the paddle
        ball.speedY = collidePoint * 6;
        
        // Slightly increase ball speed with each hit
        ball.speedX *= 1.05;
        if (Math.abs(ball.speedX) > 15) ball.speedX = (ball.speedX > 0) ? 15 : -15;
        
        return true;
    }

    /**
     * Resize paddle based on canvas size
     */
    resize(canvasHeight, scale) {
        this.height = PADDLE_HEIGHT * scale;
        // Store the maximum Y position for bounds checking
        this.maxY = canvasHeight - this.height;
        // Ensure paddle stays within canvas after resize
        this.y = Math.max(0, Math.min(this.maxY, this.y));
    }
} 
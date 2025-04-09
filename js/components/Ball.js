/**
 * Ball component for the Pong game
 */
import { COLORS, BALL_SIZE } from '../utils/constants.js';
import { TrailParticle } from './Particles.js';

export class Ball {
    constructor(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.size = BALL_SIZE;
        this.speedX = 5;
        this.speedY = 5;
        this.color = COLORS.ball;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.trail = [];
    }

    /**
     * Update ball position
     */
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
    }

    /**
     * Draw the ball on the canvas
     */
    draw(ctx) {
        ctx.fillStyle = this.color;
        
        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    /**
     * Reset ball to center
     */
    reset() {
        this.x = this.canvasWidth / 2;
        this.y = this.canvasHeight / 2;
        this.speedX = -this.speedX;
        this.speedY = Math.random() * 10 - 5;
        
        // Reset ball speed if it has become too fast
        if (Math.abs(this.speedX) > 10) {
            this.speedX = this.speedX > 0 ? 5 : -5;
        }
    }

    /**
     * Add a trail particle at current position
     */
    addTrailParticle() {
        const colorIndex = Math.floor(Math.random() * COLORS.trail.length);
        return new TrailParticle(this.x, this.y, COLORS.trail[colorIndex], this.size);
    }

    /**
     * Resize ball based on canvas size
     */
    resize(scale) {
        this.size = BALL_SIZE * scale;
    }
} 
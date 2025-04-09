/**
 * Particle systems for visual effects
 */
import { COLORS } from '../utils/constants.js';

/**
 * Base particle for explosion effects
 */
export class Particle {
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

    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

/**
 * Trail particle for ball movement effects
 */
export class TrailParticle {
    constructor(x, y, color, ballSize) {
        this.x = x;
        this.y = y;
        this.size = ballSize * 0.7;
        this.color = color;
        this.alpha = 0.7;
        this.decay = 0.035;
    }

    update() {
        this.alpha -= this.decay;
        this.size -= this.decay;
    }

    draw(ctx) {
        if (this.alpha <= 0) return;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

/**
 * Confetti particle for win celebration
 */
export class ConfettiParticle {
    constructor(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight - canvasHeight;
        this.size = Math.random() * 10 + 5;
        this.color = COLORS.trail[Math.floor(Math.random() * COLORS.trail.length)];
        this.speedY = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.angle = Math.random() * 360;
        this.spin = Math.random() * 10 - 5;
        this.shape = Math.floor(Math.random() * 3); // 0: square, 1: circle, 2: triangle
        this.canvasHeight = canvasHeight;
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.angle += this.spin;
        
        // Reset if off-screen
        if (this.y > this.canvasHeight + this.size) {
            this.y = -this.size;
            this.x = Math.random() * this.canvasWidth;
        }
    }

    draw(ctx) {
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

/**
 * Create a particle explosion
 */
export function createParticleExplosion(x, y, color, amount, speedFactor = 1) {
    const particles = [];
    for (let i = 0; i < amount; i++) {
        particles.push(new Particle(x, y, color, speedFactor));
    }
    return particles;
}

/**
 * Create confetti for win celebration
 */
export function createConfetti(canvasWidth, canvasHeight, amount = 100) {
    const confetti = [];
    for (let i = 0; i < amount; i++) {
        confetti.push(new ConfettiParticle(canvasWidth, canvasHeight));
    }
    return confetti;
} 
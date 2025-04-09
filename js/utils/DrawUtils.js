/**
 * Drawing utilities for the Pong game
 */

/**
 * Draw a net in the middle of the canvas
 */
export function drawNet(ctx, canvasHeight) {
    for (let i = 0; i < canvasHeight; i += 40) {
        const netColor = `rgba(255, 255, 255, ${0.5 + Math.sin(Date.now() * 0.003 + i * 0.1) * 0.5})`;
        ctx.fillStyle = netColor;
        ctx.fillRect(ctx.canvas.width / 2 - 1, i, 2, 20);
    }
}

/**
 * Draw text with glow effect
 */
export function drawText(ctx, text, x, y, color, size = 30, align = 'center') {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px Orbitron`;
    ctx.textAlign = align;
    
    // Add glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
}

/**
 * Draw game background with semi-transparent fade
 */
export function drawBackground(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Fill with semi-transparent background for fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Draw win message with background
 */
export function drawWinMessage(ctx, text, color) {
    // Draw background for text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(ctx.canvas.width / 2 - 150, ctx.canvas.height / 2 - 40, 300, 80);
    
    // Draw text with glow effect
    drawText(ctx, text, ctx.canvas.width / 2, ctx.canvas.height / 2, color, 40);
} 
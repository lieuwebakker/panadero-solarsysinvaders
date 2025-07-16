// src/core/Ship.js
export class Ship {
    constructor(x, y, gameWidth = 600, gameHeight = 400) {
        this.x = x;
        this.y = y;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.angle = 0;
        this.rotatingLeft = false;
        this.rotatingRight = false;
        this.engineOn = false;
        this.velocity = { x: 0, y: 0 };
        // Add pattern property with random assignment
        this.pattern = Math.random() < 0.5 ? 'fighter' : 'ufo';
    }

    move() {
        // Rotation
        if (this.rotatingLeft) this.angle -= 0.1;
        if (this.rotatingRight) this.angle += 0.1;

        // Thrust
        if (this.engineOn) {
            this.velocity.x += Math.sin(this.angle) * 0.1;
            this.velocity.y -= Math.cos(this.angle) * 0.1;
        }

        // Move
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Wrap around screen using modulo
        this.x = ((this.x % this.gameWidth) + this.gameWidth) % this.gameWidth;
        this.y = ((this.y % this.gameHeight) + this.gameHeight) % this.gameHeight;

        // Add drag
        this.velocity.x *= 0.99;
        this.velocity.y *= 0.99;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));
        ctx.rotate(this.angle);
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;

        if (this.pattern === 'ufo') {
            // UFO Pattern
            // Main saucer body
            ctx.beginPath();
            ctx.ellipse(0, 0, 15, 6, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            // Top dome
            ctx.beginPath();
            ctx.arc(0, -3, 8, Math.PI, 0, false);
        ctx.stroke();

            // Bottom lights
            [-10, -5, 0, 5, 10].forEach(x => {
                ctx.beginPath();
                ctx.arc(x, 2, 1, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
            });

            // Engine flame for UFO
            if (this.engineOn) {
                ctx.beginPath();
                ctx.strokeStyle = '#00ffff';
                [-8, 0, 8].forEach(x => {
                    ctx.beginPath();
                    ctx.moveTo(x, 4);
                    ctx.lineTo(x, 8 + Math.random() * 3);
                    ctx.stroke();
                });
            }
        } else {
            // Fighter Pattern (original triangle ship)
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(10, 15);
            ctx.lineTo(-10, 15);
            ctx.closePath();
            ctx.stroke();

            // Original engine flame
            if (this.engineOn) {
                ctx.beginPath();
                ctx.moveTo(-5, 15);
                ctx.lineTo(5, 15);
                ctx.lineTo(0, 25 + Math.random() * 10);
                ctx.closePath();
                ctx.fillStyle = 'orange';
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
}
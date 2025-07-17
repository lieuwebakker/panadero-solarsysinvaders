// src/core/Ship.js
// Define ship type configurations at the top of the file
const SHIP_CONFIGS = {
    fighter: {
        shootDelay: 150,
        speed: 0.1,
        turnSpeed: 0.1,
        drag: 0.99,
        health: 100
    },
    ufo: {
        shootDelay: 250,
        speed: 0.08,
        turnSpeed: 0.08,
        drag: 0.995,
        health: 120
    }
    // Easy to add new ship types:
    // interceptor: {
    //     shootDelay: 100,
    //     speed: 0.12,
    //     turnSpeed: 0.15,
    //     drag: 0.98,
    //     health: 80
    // }
};

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
        
        // Apply ship type configuration
        const config = SHIP_CONFIGS[this.pattern];
        this.shootDelay = config.shootDelay;
        this.speed = config.speed;
        this.turnSpeed = config.turnSpeed;
        this.drag = config.drag;
        this.health = config.health;
        
        // Add bullet properties
        this.bullets = [];
        this.lastShot = 0;
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot >= this.shootDelay) {
            // Create new bullet at ship's position
            const bullet = new Bullet(
                this.x,
                this.y,
                this.angle,
                10,
                this.color || '#FFFF00'
            );
            this.bullets.push(bullet);
            this.lastShot = now;
            return true;
        }
        return false;
    }

    move() {
        // Get time since last frame (default to 1/60 if not provided)
        const deltaTime = 1/60;
        
        // Rotation with time-based movement
        if (this.rotatingLeft) this.angle -= this.turnSpeed * deltaTime * 60;
        if (this.rotatingRight) this.angle += this.turnSpeed * deltaTime * 60;

        // Thrust with time-based movement
        if (this.engineOn) {
            this.velocity.x += Math.sin(this.angle) * this.speed * deltaTime * 60;
            this.velocity.y -= Math.cos(this.angle) * this.speed * deltaTime * 60;
        }

        // Move with current velocity
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Wrap around screen using modulo
        this.x = ((this.x % this.gameWidth) + this.gameWidth) % this.gameWidth;
        this.y = ((this.y % this.gameHeight) + this.gameHeight) % this.gameHeight;

        // Add drag
        this.velocity.x *= Math.pow(this.drag, deltaTime * 60);
        this.velocity.y *= Math.pow(this.drag, deltaTime * 60);

        // Update bullets
        this.bullets = this.bullets.filter(bullet => bullet.active);
        this.bullets.forEach(bullet => bullet.move());
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
        
        // Draw bullets
        this.bullets.forEach(bullet => bullet.draw(ctx));

        ctx.restore();
    }
}
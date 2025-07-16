export class Bullet {
    constructor(x, y, angle, speed = 10, color = '#FFFF00') {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.color = color;
        this.radius = 2;
        this.active = true;
        this.lifespan = 2000; // 2 seconds
        this.created = Date.now();
    }

    move() {
        // Move bullet in direction of angle
        this.x += Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;

        // Check if bullet should expire
        if (Date.now() - this.created > this.lifespan) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
} 
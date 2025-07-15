export class CanvasManager {
    constructor(canvas, width = 800, height = 600) {
        if (!canvas) {
            throw new Error('Canvas element is required');
        }
        
        this.mainCanvas = canvas;
        this.width = width;
        this.height = height;
        
        try {
            this.ctx = canvas.getContext('2d', {
                alpha: false,
                desynchronized: true // Potential performance boost
            });
            
            if (!this.ctx) {
                throw new Error('Failed to get 2D context');
            }
            
            // Initialize canvas with correct size
        this.setCanvasSize(width, height);
            
            // Initialize stars
            this.stars = this.generateStars();
            
            console.log('CanvasManager initialized successfully');
        } catch (error) {
            console.error('CanvasManager initialization failed:', error);
            throw error;
        }
    }

    setCanvasSize(width, height) {
        // Set both the canvas element and context size
        this.mainCanvas.style.width = `${width}px`;
        this.mainCanvas.style.height = `${height}px`;
        this.mainCanvas.width = width;
        this.mainCanvas.height = height;
        
        // Store dimensions
        this.width = width;
        this.height = height;
        
        // Set rendering options
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    generateStars() {
        const stars = [];
        for (let i = 0; i < 200; i++) {
            stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: Math.random() * 1.2 + 0.3,
                twinkleSpeed: Math.random() * 2 + 1,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }
        return stars;
    }

    startGameLoop() {
        this.isRunning = true;
        this.animate();
    }

    stopGameLoop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    animate() {
        if (!this.isRunning) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw starfield background
        this.drawStarfield();
        
        // Continue animation loop
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    drawStarfield() {
        const now = performance.now() / 1000;
        
        // Create space background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(1, '#000066');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stars with fixed positions
        this.stars.forEach(star => {
            const twinkle = Math.sin(now * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
            const opacity = Math.min(1, 0.8 + 0.2) * twinkle;
            
            const starGradient = this.ctx.createRadialGradient(
                star.x, star.y, 0,
                star.x, star.y, star.radius
            );
            starGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
            starGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.beginPath();
            this.ctx.fillStyle = starGradient;
            this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    destroy() {
        if (this.ctx) {
            // Clear the canvas before destroying
            this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx = null;
        }
        this.mainCanvas = null;
        this.stars = null;
    }
} 
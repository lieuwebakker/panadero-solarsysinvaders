<template>
    <div class="game-container">
        <canvas ref="canvas" class="game-canvas"></canvas>
        
        <!-- Info panel -->
        <div v-if="shipInfo" class="info-panel">
            <div class="info-row">Position: <span class="value">{{ shipInfo.position.x.toString().padStart(6) }}, {{ shipInfo.position.y.toString().padStart(6) }}</span></div>
            <div class="info-row">Angle: <span class="value">{{ shipInfo.angle.toString().padStart(6) }}°</span></div>
            <div class="info-row">Velocity: <span class="value">{{ shipInfo.velocity.x.toString().padStart(6) }}, {{ shipInfo.velocity.y.toString().padStart(6) }}</span></div>
            <div class="info-row">Home: <span class="value">{{ shipInfo.home.x.toString().padStart(6) }}, {{ shipInfo.home.y.toString().padStart(6) }}</span></div>
            <div class="info-row">Score: <span class="value">{{ score.toString().padStart(6) }}</span></div>
            <div class="info-row">Pattern: <span class="value">{{ shipInfo.pattern.padEnd(6) }}</span></div>
            <div class="info-row">Team: <span class="value">{{ shipInfo.color.padEnd(6) }}</span></div>
            <div class="info-row">Safe Zone: <span class="value">{{ inSafeZone ? 'Yes' : 'No' }}</span></div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Ship } from '../core/Ship';
import { CanvasManager } from '../core/Canvas';
import { useMultiplayer } from '../composables/useMultiplayer';

console.log('🎮 Game Component: Loading');

// Define game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const SHIP_RADIUS = 10; // Changed from 15

const props = defineProps({
    multiplayer: {
        type: Boolean,
        default: true
    },
    serverUrl: {
        type: String,
        default: import.meta.env.VITE_GAME_SERVER_URL
    }
});

const canvas = ref(null);
const canvasManager = ref(null);
const isRunning = ref(false);
const ship = ref(null);

// Add camera state
const camera = ref({
    x: 0,
    y: 0,
    scale: 1
});

// Add function to convert world coordinates to screen coordinates
const worldToScreen = (worldX, worldY) => {
    const screenX = (worldX - camera.value.x) * camera.value.scale + GAME_WIDTH / 2;
    const screenY = (worldY - camera.value.y) * camera.value.scale + GAME_HEIGHT / 2;
    return { x: screenX, y: screenY };
};

// Update drawStarfield to create infinite star effect
const drawStarfield = (ctx) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Update the star layers with higher counts
    const layers = [
        { count: 60,  parallax: 0.01, size: 0.8, brightness: 0.2 },  // Doubled from 30
        { count: 50,  parallax: 0.02, size: 1.0, brightness: 0.3 },  // Doubled from 25
        { count: 40,  parallax: 0.029, size: 1.3, brightness: 0.5 }, // Doubled from 20
        { count: 30,  parallax: 0.045, size: 1.7, brightness: 0.7 }, // Doubled from 15
        { count: 20,  parallax: 0.059, size: 2.0, brightness: 0.9 }  // Doubled from 10
    ];

    const time = Date.now() * 0.001;

    layers.forEach((layer, layerIndex) => {
        const viewX = camera.value.x * layer.parallax;
        const viewY = camera.value.y * layer.parallax;
        
        const areaSize = GAME_WIDTH * 2;
        const startX = Math.floor(viewX / areaSize) * areaSize;
        const startY = Math.floor(viewY / areaSize) * areaSize;

        for (let areaX = startX - areaSize; areaX <= startX + areaSize; areaX += areaSize) {
            for (let areaY = startY - areaSize; areaY <= startY + areaSize; areaY += areaSize) {
                for (let i = 0; i < layer.count; i++) {
                    const seed = (areaX + areaY * 1000 + i * 100 + layerIndex * 10000);
                    const x = areaX + Math.abs(Math.sin(seed * 0.37)) * areaSize;
                    const y = areaY + Math.abs(Math.cos(seed * 0.23)) * areaSize;
                    
                    const starX = x - viewX;
                    const starY = y - viewY;
                    
                    const flickerRate = 0.3 + (Math.sin(seed * 0.37) * 0.3);
                    const flickerAmount = 0.25 + (Math.cos(seed * 0.23) * 0.15);
                    const flicker = Math.sin(time * flickerRate + seed) * flickerAmount + 0.8;
                    const alpha = layer.brightness * flicker;
                    
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(starX, starY, layer.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    });
}

// Initialize multiplayer
const { gameState, isConnected, connect, sendInput, socket } = useMultiplayer({
    serverUrl: props.serverUrl
});

// Initialize refs at the top of the script
const shipInfo = ref(null);  // Changed from an object to null initially
const score = ref(0);

// Add this ref for safe zone status
const inSafeZone = ref(false);

// Add this function before the gameLoop
const isInSafeZone = (x, y, playerId) => {
    if (!gameState.value?.homePositions) return false;
    
    for (const [homeId, homePos] of Object.entries(gameState.value.homePositions)) {
        const dx = Math.abs(x - homePos.x);
        const dy = Math.abs(y - homePos.y);
        // Check if position is within safe zone (300 units)
        if (dx <= 150 && dy <= 150) { // 300/2 = 150 units from center
            return true;
        }
    }
    return false;
};

const initCanvas = () => {
    console.log('🎮 Initializing canvas');
    if (!canvas.value) return false;
    
    // Set both the canvas element AND its drawing context size
    canvas.value.style.width = `${GAME_WIDTH}px`;
    canvas.value.style.height = `${GAME_HEIGHT}px`;
    canvas.value.width = GAME_WIDTH;  // Important: this sets the drawing context size
    canvas.value.height = GAME_HEIGHT;
    
    canvasManager.value = new CanvasManager(canvas.value, GAME_WIDTH, GAME_HEIGHT);
    ship.value = new Ship(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    return true;
};

// Update ship drawing to use camera transform
const drawShip = (ctx, shipState) => {
    const screenPos = worldToScreen(shipState.position.x, shipState.position.y);
    
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    ctx.rotate(shipState.angle);
    
    ctx.strokeStyle = shipState.color;
    ctx.fillStyle = shipState.color;
    ctx.lineWidth = 2;
    
    if (shipState.pattern === 'ufo') {
        // UFO shape
        // Main saucer body
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
        
        // Top dome
        ctx.beginPath();
        ctx.arc(0, -3, 8, Math.PI, 0, false);
        ctx.stroke();
        ctx.fill();
        
        // Bottom lights - changed to black
        [-10, -5, 0, 5, 10].forEach(x => {
            ctx.beginPath();
            ctx.arc(x, 2, 1, 0, Math.PI * 2);
            ctx.fillStyle = 'black';  // Changed from 'white' to 'black'
            ctx.fill();
        });
    } else {
        // Default fighter shape
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(7, 10);
        ctx.lineTo(0, 7);
        ctx.lineTo(-7, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    // Draw engine flame if active
    if (shipState.controls?.engineOn) {
        ctx.beginPath();
        ctx.strokeStyle = '#FF9900';
        ctx.moveTo(0, 8);
        ctx.lineTo(3, 13);
        ctx.lineTo(0, 17);
        ctx.lineTo(-3, 13);
        ctx.closePath();
        ctx.stroke();
    }
    
    ctx.restore();
};

// Add function to draw home positions
const drawHome = (ctx, homePosition) => {
    // Convert world coordinates to screen coordinates
    const screenPos = worldToScreen(homePosition.x, homePosition.y);
    
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    
    // Draw a box with border lines
    const boxSize = 20; // Size of the box
    ctx.strokeStyle = homePosition.color || '#FFFFFF'; // Use player color or default to white
    ctx.lineWidth = 2;
    
    // Draw the box
    ctx.beginPath();
    ctx.rect(-boxSize/2, -boxSize/2, boxSize, boxSize);
    ctx.stroke();
    
    ctx.restore();
};

// Add collectible drawing function
const drawCollectible = (ctx, collectible) => {
    const screenPos = worldToScreen(collectible.x, collectible.y);
    
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    
    ctx.beginPath();
    ctx.strokeStyle = collectible.color;
    ctx.fillStyle = collectible.color;
    ctx.lineWidth = 2;
    
    // Draw based on type
    switch(collectible.type) {
        case 'star':
            // Draw 5-pointed star
            for(let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5;
                const x = Math.cos(angle) * collectible.radius;
                const y = Math.sin(angle) * collectible.radius;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            break;
            
        case 'diamond':
            // Draw diamond shape
            ctx.moveTo(0, -collectible.radius);
            ctx.lineTo(collectible.radius, 0);
            ctx.lineTo(0, collectible.radius);
            ctx.lineTo(-collectible.radius, 0);
            break;
            
        case 'orb':
            // Draw circle
            ctx.arc(0, 0, collectible.radius, 0, Math.PI * 2);
            break;
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Add sparkle effect
    const time = Date.now() / 1000;
    const sparkleSize = Math.sin(time * 4) * 3 + 5;
    ctx.beginPath();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.moveTo(-sparkleSize, 0);
    ctx.lineTo(sparkleSize, 0);
    ctx.moveTo(0, -sparkleSize);
    ctx.lineTo(0, sparkleSize);
    ctx.stroke();
    
    ctx.restore();
};

// Add function to draw safe zones
const drawSafeZone = (ctx, homePosition) => {
    // Convert world coordinates to screen coordinates
    const screenPos = worldToScreen(homePosition.x, homePosition.y);
    
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    
    // Safe zone box reduced to 300 units
    const safeZoneSize = 300;
    ctx.strokeStyle = homePosition.color || '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.rect(
        -safeZoneSize/2, 
        -safeZoneSize/2, 
        safeZoneSize, 
        safeZoneSize
    );
    ctx.stroke();
    
    ctx.setLineDash([]);
    ctx.restore();
}

// Update the bullet drawing function
const drawBullet = (ctx, bullet) => {
    if (!bullet || typeof bullet.x !== 'number' || typeof bullet.y !== 'number') {
        console.warn('Invalid bullet data:', bullet);
        return;
    }

    const screenPos = worldToScreen(bullet.x, bullet.y);
    
    ctx.save();
    ctx.translate(screenPos.x, screenPos.y);
    
    // Make bullets more visible
    ctx.fillStyle = bullet.color || '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2); // Slightly larger radius
    ctx.fill();
    
    ctx.restore();
};

// Update handleKeyDown to include space for shooting
function handleKeyDown(event) {
    console.log('Key down event:', event.key); // Debug log
    switch(event.key) {
        case 'ArrowLeft':
            sendInput('rotate_left', true);
            break;
        case 'ArrowRight':
            sendInput('rotate_right', true);
            break;
        case 'ArrowUp':
            sendInput('thrust', true);
            break;
        case ' ': // Space key
            console.log('Space key pressed - sending shoot input'); // Debug log
            sendInput('shoot', true);
            break;
        case 'h':
        case 'H':
            sendInput('warp_home', true);
            break;
    }
}

function handleKeyUp(event) {
    switch(event.key) {
        case 'ArrowLeft':
            sendInput('rotate_left', false);
            break;
        case 'ArrowRight':
            sendInput('rotate_right', false);
            break;
        case 'ArrowUp':
            sendInput('thrust', false);
            break;
        case ' ': // Add space key up handler
            sendInput('shoot', false);
            break;
    }
}

// Update the gameLoop
const gameLoop = () => {
    if (!isRunning.value) return;
    
    // Update camera position to follow player's ship
    if (ship.value) {
        // Smooth camera movement
        const targetX = ship.value.x;
        const targetY = ship.value.y;
        camera.value.x += (targetX - camera.value.x) * 0.1;
        camera.value.y += (targetY - camera.value.y) * 0.1;
    }
    
    // Clear and draw starfield
    drawStarfield(canvasManager.value.ctx);
    
    // Draw home positions first (so they appear behind ships)
    if (gameState.value.homePositions) {
        for (const homePosition of Object.values(gameState.value.homePositions)) {
            drawSafeZone(canvasManager.value.ctx, homePosition);  // Draw safe zone first
            drawHome(canvasManager.value.ctx, homePosition);      // Then draw home box on top
        }
    }
    
    // Draw collectibles
    if (gameState.value.collectibles) {
        for (const collectible of Object.values(gameState.value.collectibles)) {
            drawCollectible(canvasManager.value.ctx, collectible);
        }
    }

    // Debug log bullets before rendering
    console.log('Current game state bullets:', gameState.value.bullets);

    // Draw bullets with debug logging
    if (gameState.value?.bullets) {
        console.log('Drawing bullets:', gameState.value.bullets);
        gameState.value.bullets.forEach(bullet => {
            drawBullet(canvasManager.value.ctx, bullet);
        });
    }
    
    // Debug log the game state
    console.log('Current game state:', gameState.value);
    
    // Draw all players from game state
    for (const [id, playerState] of Object.entries(gameState.value.players)) {
        console.log(`Drawing player ${id} with state:`, playerState); // Debug log
        drawShip(canvasManager.value.ctx, playerState);
        
        // Update info panel for our ship
        if (socket.value && id === socket.value.id && ship.value) {
            ship.value.x = playerState.position.x;
            ship.value.y = playerState.position.y;
            ship.value.angle = playerState.angle;
            ship.value.velocity = playerState.velocity;
            
            // Update all ship info including home position
            shipInfo.value = {
                position: { 
                    x: Math.round(playerState.position.x), 
                    y: Math.round(playerState.position.y) 
                },
                home: playerState.home,  // Make sure home position is included
                angle: Math.round(playerState.angle * 180 / Math.PI),
                velocity: { 
                    x: playerState.velocity.x.toFixed(2), 
                    y: playerState.velocity.y.toFixed(2) 
                },
                controls: playerState.controls,
                color: playerState.color,
                pattern: playerState.pattern,
                score: playerState.score || 0
            };
            
            // Update safe zone status
            inSafeZone.value = isInSafeZone(
                playerState.position.x, 
                playerState.position.y,
                socket.value.id
            );
            
            // Update score
            score.value = playerState.score || 0;
        }
    }
    
    requestAnimationFrame(gameLoop);
};

// Add initial state setup in onMounted
onMounted(() => {
    console.log('🎮 Game Component: Mounted');
    if (initCanvas()) {
        console.log('🎮 Canvas initialized');
        isRunning.value = true;
        
        // Initialize shipInfo with default values
        shipInfo.value = {
            position: { x: 0, y: 0 },
            home: { x: 0, y: 0 },
            angle: 0,
            velocity: { x: '0.00', y: '0.00' },
            controls: {
                rotatingLeft: false,
                rotatingRight: false,
                engineOn: false
            },
            color: '#FFFFFF',
            pattern: 'fighter'
        };
        console.log('Initial shipInfo set:', shipInfo.value);
        
        gameLoop();
        if (props.multiplayer) {
            console.log('🎮 Connecting to multiplayer...');
            connect();
        }
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Add shoot blocked handler
        socket.value.on('shoot_blocked', (data) => {
            if (data.reason === 'in_safe_zone') {
                console.log('Cannot shoot in safe zones!');
                // Optional: Add visual feedback here
            }
        });
    }
});

onUnmounted(() => {
    console.log(' Game Component: Unmounting');
    isRunning.value = false;
    // Remove keyboard controls
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
});
</script>

<style scoped>
.game-container {
    position: relative;
    width: 800px;
    height: 600px;
}

.game-canvas {
    position: absolute;
    top: 0;
    left: 0;
}

.info-panel {
    position: absolute;
    top: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.3);  /* Increased transparency (0.3 from 0.5) */
    color: #33FF33;
    font-family: 'Courier New', monospace;
    padding: 12px 15px;  /* Reduced padding */
    border-radius: 8px;
    border: 1px solid rgba(51, 255, 51, 0.5);  /* Thinner, more transparent border */
    font-size: 14px;
    line-height: 1.6;
    min-width: 240px;  /* Reduced from 300px */
    max-width: 240px;  /* Added max-width to ensure consistent size */
    box-shadow: 0 0 10px rgba(51, 255, 51, 0.15);  /* More transparent shadow */
    backdrop-filter: blur(2px);  /* Reduced blur effect */
}

.info-row {
    margin: 4px 0;
    display: flex;
    justify-content: space-between;
    white-space: pre;
}

.label {
    color: rgba(51, 255, 51, 0.9);  /* Slightly transparent green */
    font-size: 13px;  /* Slightly larger than values for contrast */
}

.value {
    color: rgba(255, 255, 255, 0.95);  /* Kept text mostly opaque for readability */
    text-shadow: 0 0 5px rgba(51, 255, 51, 0.5);  /* More transparent glow */
    font-family: 'Courier New', monospace;
    font-size: 12px;  /* Reduced from 14px */
    min-width: 120px;  /* Reduced from 160px */
    text-align: right;
    display: inline-block;
}
</style> 
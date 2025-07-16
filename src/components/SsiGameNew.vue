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
        default: 'http://192.168.2.20:8000/home/solarsys'
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
const { gameState, isConnected, connect, sendShipState, sendInput, socket } = useMultiplayer({
    serverUrl: props.serverUrl
});

// Add new refs for info panel
const shipInfo = ref({
    position: { x: 0, y: 0 },
    angle: 0,
    velocity: { x: 0, y: 0 },
    controls: {
        rotatingLeft: false,
        rotatingRight: false,
        engineOn: false
    },
    home: { x: 0, y: 0 } // Added home position to shipInfo
});

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

// Current key handlers need to be fixed to match the server's expected input types
function handleKeyDown(event) {
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
        case 'h':
        case 'H':
            // Send warp home command when H is pressed
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
        // No need for keyup on 'H' since it's an instant action
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
            
            shipInfo.value = {
                position: { 
                    x: Math.round(playerState.position.x), 
                    y: Math.round(playerState.position.y) 
                },
                home: {  // Add this
                    x: Math.round(playerState.home.x),
                    y: Math.round(playerState.home.y)
                },
                angle: Math.round(playerState.angle * 180 / Math.PI),
                velocity: { 
                    x: playerState.velocity.x.toFixed(2), 
                    y: playerState.velocity.y.toFixed(2) 
                },
                controls: playerState.controls,
                color: playerState.color
            };
        }
    }
    
    requestAnimationFrame(gameLoop);
};

onMounted(() => {
    console.log('🎮 Game Component: Mounted');
    if (initCanvas()) {
        console.log('🎮 Canvas initialized');
        isRunning.value = true;
        gameLoop();
        if (props.multiplayer) {
            console.log('🎮 Connecting to multiplayer...');
            connect();
        }
        // Add keyboard controls
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
    }
});

onUnmounted(() => {
    console.log('🎮 Game Component: Unmounting');
    isRunning.value = false;
    // Remove keyboard controls
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
});
</script>

<template>
    <div class="game-wrapper">
        <canvas ref="canvas" :width="GAME_WIDTH" :height="GAME_HEIGHT"></canvas>
        <div class="info-panel">
            <div class="info-section">
                <h3>Ship Status</h3>
                <div class="info-row">
                    <span class="info-label">Color:</span>
                    <span class="info-value" :style="{ color: shipInfo.color }">■</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Position:</span>
                    <span class="info-value">X:{{ shipInfo.position.x }}</span>
                    <span class="info-value">Y:{{ shipInfo.position.y }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Home:</span>
                    <span class="info-value">X:{{ shipInfo.home.x }}</span>
                    <span class="info-value">Y:{{ shipInfo.home.y }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Angle:</span>
                    <span class="info-value">{{ shipInfo.angle }}°</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Velocity:</span>
                    <span class="info-value">X:{{ shipInfo.velocity.x }}</span>
                    <span class="info-value">Y:{{ shipInfo.velocity.y }}</span>
                </div>
            </div>
            <div class="info-section">
                <h3>Controls</h3>
                <div class="info-row">
                    <span class="info-label">Left:</span>
                    <span class="info-value">{{ shipInfo.controls.rotatingLeft ? '✓' : '×' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Right:</span>
                    <span class="info-value">{{ shipInfo.controls.rotatingRight ? '✓' : '×' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Thrust:</span>
                    <span class="info-value">{{ shipInfo.controls.engineOn ? '✓' : '×' }}</span>
                </div>
            </div>
            <div class="info-section">
                <h3>Network</h3>
                <div class="info-row">
                    <span class="info-label">Connected:</span>
                    <span class="info-value">{{ isConnected ? '✓' : '×' }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value">{{ gameState.status }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.game-wrapper {
    width: 800px;
    height: 600px;
    overflow: hidden;
    position: relative;
}

.info-panel {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: #00ff00;
    font-family: monospace;
    padding: 10px;
    border: 1px solid #00ff00;
    border-radius: 4px;
    font-size: 12px;
    z-index: 100;
}

.info-section {
    margin-bottom: 10px;
}

.info-section h3 {
    color: #00ff00;
    margin: 0 0 5px 0;
    font-size: 14px;
    border-bottom: 1px solid #00ff00;
}

.info-row {
    display: flex;
    margin: 2px 0;
    align-items: center;
}

.info-label {
    min-width: 70px;
}

.info-value {
    min-width: 60px;
    text-align: right;
    padding: 0 5px;
}
</style> 
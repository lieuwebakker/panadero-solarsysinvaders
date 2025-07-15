<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Ship } from '../core/Ship';
import { CanvasManager } from '../core/Canvas';
import { useMultiplayer } from '../composables/useMultiplayer';

console.log('🎮 Game Component: Loading');

// Define game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const props = defineProps({
    multiplayer: {
        type: Boolean,
        default: true
    },
    serverUrl: {
        type: String,
        default: 'http://localhost:3000'
    }
});

const canvas = ref(null);
const canvasManager = ref(null);
const isRunning = ref(false);
const ship = ref(null);

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
    }
});

const initCanvas = () => {
    console.log('🎮 Initializing canvas');
    if (!canvas.value) return false;
    canvasManager.value = new CanvasManager(canvas.value);
    // Initialize ship in the center of the screen
    ship.value = new Ship(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT);
    return true;
};

// In the script section, add a method to draw ships
const drawShip = (ctx, shipState) => {
    const { position, angle, color = '#FFFFFF' } = shipState; // Default to white if no color
    console.log('Drawing ship with color:', color); // Debug log

    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(angle);
    
    // Draw ship
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    
    // Ship shape
    ctx.moveTo(0, -15);
    ctx.lineTo(10, 15);
    ctx.lineTo(0, 10);
    ctx.lineTo(-10, 15);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // Draw thrust if engine is on
    if (shipState.controls?.engineOn) {
        ctx.beginPath();
        ctx.strokeStyle = '#FF9900';
        ctx.moveTo(0, 12);
        ctx.lineTo(5, 20);
        ctx.lineTo(0, 25);
        ctx.lineTo(-5, 20);
        ctx.closePath();
        ctx.stroke();
    }
    
    ctx.restore();
};

// Current key handlers need to be fixed to match the server's expected input types
const handleKeyDown = (e) => {
    console.log('Key pressed:', e.key); // Debug log
    if (!ship.value) return;
    
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            ship.value.rotatingLeft = true;
            sendInput('rotate_left', true);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            ship.value.rotatingRight = true;
            sendInput('rotate_right', true);
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            ship.value.engineOn = true;
            sendInput('thrust', true);
            break;
    }
};

const handleKeyUp = (e) => {
    console.log('Key released:', e.key); // Debug log
    if (!ship.value) return;
    
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            ship.value.rotatingLeft = false;
            sendInput('rotate_left', false);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            ship.value.rotatingRight = false;
            sendInput('rotate_right', false);
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            ship.value.engineOn = false;
            sendInput('thrust', false);
            break;
    }
};

// Update the gameLoop
const gameLoop = () => {
    if (!isRunning.value) return;
    
    canvasManager.value.drawStarfield();
    
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
                angle: Math.round(playerState.angle * 180 / Math.PI),
                velocity: { 
                    x: playerState.velocity.x.toFixed(2), 
                    y: playerState.velocity.y.toFixed(2) 
                },
                controls: playerState.controls,
                color: playerState.color // Make sure color is included
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
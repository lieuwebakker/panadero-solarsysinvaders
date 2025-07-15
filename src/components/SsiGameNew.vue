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
const { gameState, isConnected, connect } = useMultiplayer({
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

const handleKeyDown = (e) => {
    if (!ship.value) return;
    switch(e.key) {
        case 'ArrowLeft':
            ship.value.rotatingLeft = true;
            break;
        case 'ArrowRight':
            ship.value.rotatingRight = true;
            break;
        case 'ArrowUp':
            ship.value.engineOn = true;
            break;
    }
};

const handleKeyUp = (e) => {
    if (!ship.value) return;
    switch(e.key) {
        case 'ArrowLeft':
            ship.value.rotatingLeft = false;
            break;
        case 'ArrowRight':
            ship.value.rotatingRight = false;
            break;
        case 'ArrowUp':
            ship.value.engineOn = false;
            break;
    }
};

const gameLoop = () => {
    if (!isRunning.value) return;
    
    canvasManager.value.drawStarfield();
    
    if (ship.value) {
        ship.value.move();
        ship.value.draw(canvasManager.value.ctx);
        
        // Update info panel data
        shipInfo.value = {
            position: { 
                x: Math.round(ship.value.x), 
                y: Math.round(ship.value.y) 
            },
            angle: Math.round(ship.value.angle * 180 / Math.PI),
            velocity: { 
                x: ship.value.velocity.x.toFixed(2), 
                y: ship.value.velocity.y.toFixed(2) 
            },
            controls: {
                rotatingLeft: ship.value.rotatingLeft,
                rotatingRight: ship.value.rotatingRight,
                engineOn: ship.value.engineOn
            }
        };
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
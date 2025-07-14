<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Ship } from '../core/Ship';
import { CanvasManager } from '../core/Canvas';
import { useMultiplayer } from '../composables/useMultiplayer';

// Framework expects these exact props
const props = defineProps({
    player: String,
    id: String,
    serverUrl: {
        type: String,
        required: true  // Laravel will provide this
    }
});

// Initialize multiplayer
const { gameState, isConnected, connect, sendPlayerInput } = useMultiplayer({
    serverUrl: props.serverUrl
});

// Match the framework's state management
gameState.value = {
    status: "init",
    player: props.player || "TESTER",
    id: props.id || "cdef",
    canvas: "600x400"
};

const gameCanvas = ref(null);
const canvasManager = ref(null);
const ship = ref(null);

// Add constants for game dimensions
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;

// Framework initialization log
onMounted(() => {
    console.log('[SSI Game] Game initialized:', gameState.value);
    
    if (!gameCanvas.value) return;
    
    // Set BOTH the canvas element AND its drawing context size
    gameCanvas.value.style.width = `${GAME_WIDTH}px`;
    gameCanvas.value.style.height = `${GAME_HEIGHT}px`;
    gameCanvas.value.width = GAME_WIDTH;  // Important: this sets the drawing context size
    gameCanvas.value.height = GAME_HEIGHT;
    
    // Init canvas
    canvasManager.value = new CanvasManager(gameCanvas.value);
    
    // Start game loop
    requestAnimationFrame(gameLoop);
});

// Game state management
function handleGameStart(event) {
    event.preventDefault();
    
    if (gameState.value.status === "init") {
        gameState.value.status = "running";
        initGame();
    }
}

function initGame() {
    if (!gameCanvas.value) return;
    
    // Set both the canvas element size and drawing surface size
    gameCanvas.value.style.width = `${GAME_WIDTH}px`;
    gameCanvas.value.style.height = `${GAME_HEIGHT}px`;
    gameCanvas.value.width = GAME_WIDTH;
    gameCanvas.value.height = GAME_HEIGHT;
    
    // Initialize canvas manager with correct dimensions
    canvasManager.value = new CanvasManager(gameCanvas.value, GAME_WIDTH, GAME_HEIGHT);
    
    ship.value = new Ship(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    
    // Add controls
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(e) {
    if (!ship.value || gameState.value.status !== "running") return;
    switch(e.code) {
        case 'ArrowLeft': 
            ship.value.rotatingLeft = true; 
            sendPlayerInput({ rotatingLeft: true });
            break;
        case 'ArrowRight': 
            ship.value.rotatingRight = true;
            sendPlayerInput({ rotatingRight: true });
            break;
        case 'ArrowUp': 
            ship.value.engineOn = true;
            sendPlayerInput({ engineOn: true });
            break;
    }
}

function handleKeyUp(e) {
    if (!ship.value || gameState.value.status !== "running") return;
    switch(e.code) {
        case 'ArrowLeft': ship.value.rotatingLeft = false; break;
        case 'ArrowRight': ship.value.rotatingRight = false; break;
        case 'ArrowUp': ship.value.engineOn = false; break;
    }
}

function gameLoop() {
    if (!canvasManager.value?.ctx) return;
    
    const ctx = canvasManager.value.ctx;
    
    // Ensure we're clearing the exact canvas size
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Fill background to exact size
    ctx.fillStyle = '#000033';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    if (gameState.value.status === "init") {
        // Draw start screen
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Click to Start', GAME_WIDTH/2, GAME_HEIGHT/2);
        ctx.font = '16px Arial';
        ctx.fillText(`${gameState.value.player} (${gameState.value.id})`, GAME_WIDTH/2, GAME_HEIGHT/2 + 40);
    } else if (gameState.value.status === "running" && ship.value) {
        // Update and draw ship
        ship.value.move();
        ship.value.draw(ctx);
    }
    
    requestAnimationFrame(gameLoop);
}

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    if (canvasManager.value) {
        canvasManager.value.destroy();
    }
});
</script>

<template>
    <div class="game-container">
        <canvas 
            ref="gameCanvas" 
            class="game-canvas"
            @click="handleGameStart"
            @touchstart="handleGameStart"
        ></canvas>
    </div>
</template>

<style scoped>
.game-container {
    position: relative;
    width: 600px;
    height: 400px;
    overflow: hidden;  /* Important: clip anything outside */
    background: #000033;
}

.game-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 600px;      /* Explicit width */
    height: 400px;     /* Explicit height */
    cursor: pointer;
    display: block;    /* Remove any extra space */
}
</style>
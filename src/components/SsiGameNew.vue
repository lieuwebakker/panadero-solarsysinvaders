<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Ship } from '../core/Ship';
import { CanvasManager } from '../core/Canvas';

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;

const gameState = ref({
    status: "init",
    player: "TESTER",
    id: "cdef",
    canvas: `${GAME_WIDTH}x${GAME_HEIGHT}`
});

const gameCanvas = ref(null);
const canvasManager = ref(null);
const ship = ref(null);

function handleGameStart(event) {
    event.preventDefault();
    console.log('Game clicked!'); // Debug log
    
    if (gameState.value.status === "init") {
        console.log('Starting game...'); // Debug log
        gameState.value.status = "running";
        initGame();
    }
}

function initGame() {
    console.log('Initializing game...'); // Debug log
    ship.value = new Ship(GAME_WIDTH/2, GAME_HEIGHT/2);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(e) {
    if (!ship.value || gameState.value.status !== "running") return;
    switch(e.code) {
        case 'ArrowLeft': ship.value.rotatingLeft = true; break;
        case 'ArrowRight': ship.value.rotatingRight = true; break;
        case 'ArrowUp': ship.value.engineOn = true; break;
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
    
    // Clear the entire canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Fill background
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
        ship.value.move();
        ship.value.draw(ctx);
    }
    
    requestAnimationFrame(gameLoop);
}

onMounted(() => {
    console.log('Component mounted, setting up canvas...'); // Debug log
    if (!gameCanvas.value) return;
    
    // Set both the canvas element size and drawing buffer size
    gameCanvas.value.width = GAME_WIDTH;
    gameCanvas.value.height = GAME_HEIGHT;
    
    canvasManager.value = new CanvasManager(gameCanvas.value);
    requestAnimationFrame(gameLoop);
    
    console.log('Canvas setup complete'); // Debug log
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    if (canvasManager.value) {
        canvasManager.value.destroy();
    }
});
</script>

<template>
    <div class="game-wrapper">
        <div 
            class="game-container"
            @click="handleGameStart"
        >
            <canvas ref="gameCanvas" class="game-canvas"></canvas>
        </div>
    </div>
</template>

<style scoped>
.game-wrapper {
    width: 600px;
    height: 400px;
    overflow: hidden;
    background: #000033;
}

.game-container {
    position: relative;
    width: 600px;
    height: 400px;
}

.game-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 600px;
    height: 400px;
    display: block;
    cursor: pointer;
}
</style> 
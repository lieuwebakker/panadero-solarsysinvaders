<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';

const props = defineProps({
  gameState: {
    type: Object,
    default: () => ({})
  },
  playerId: {
    type: String,
    default: ''
  },
  size: {
    type: Number,
    default: 150
  },
  worldWidth: {
    type: Number,
    default: 8000
  },
  worldHeight: {
    type: Number,
    default: 6000
  }
});

const minimapCanvas = ref(null);
const minimapCtx = ref(null);
const animationFrame = ref(null);

// Get current player position
const playerPosition = computed(() => {
  const player = props.gameState?.players?.[props.playerId];
  return player ? player.position : { x: 0, y: 0 };
});

// Update worldToMinimap to center on player
const worldToMinimap = (worldX, worldY) => {
  const scale = props.size / Math.max(props.worldWidth, props.worldHeight);
  
  // Calculate offset from player position
  const offsetX = worldX - playerPosition.value.x;
  const offsetY = worldY - playerPosition.value.y;
  
  // Center the view on the player
  const x = (props.size / 2) + (offsetX * scale);
  const y = (props.size / 2) + (offsetY * scale);
  
  return { x, y };
};

// Draw the minimap
const drawMinimap = () => {
  if (!minimapCtx.value) return;

  const ctx = minimapCtx.value;
  const canvas = minimapCanvas.value;

  // Clear canvas
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw border
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Draw world bounds relative to player
  const topLeft = worldToMinimap(-props.worldWidth/2, -props.worldHeight/2);
  const bottomRight = worldToMinimap(props.worldWidth/2, props.worldHeight/2);
  ctx.strokeStyle = '#333';
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(
    topLeft.x,
    topLeft.y,
    bottomRight.x - topLeft.x,
    bottomRight.y - topLeft.y
  );
  ctx.setLineDash([]);

  // Draw collectibles
  if (props.gameState?.collectibles) {
    ctx.fillStyle = '#ffff00';
    Object.values(props.gameState.collectibles).forEach(collectible => {
      if (collectible && 
          typeof collectible.x === 'number' && 
          typeof collectible.y === 'number') {
        const pos = worldToMinimap(collectible.x, collectible.y);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // Draw safe zones (home positions)
  if (props.gameState?.homePositions) {
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    Object.values(props.gameState.homePositions).forEach(homePos => {
      if (homePos && 
          typeof homePos.x === 'number' && 
          typeof homePos.y === 'number') {
        const pos = worldToMinimap(homePos.x, homePos.y);
        const safeZoneRadius = 150 * (props.size / Math.max(props.worldWidth, props.worldHeight));
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, safeZoneRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    
    ctx.setLineDash([]);
  }

  // Draw other players
  if (props.gameState?.players) {
    Object.entries(props.gameState.players).forEach(([id, player]) => {
      if (!player?.position) return;

      const pos = worldToMinimap(player.position.x, player.position.y);
      
      if (id === props.playerId) {
        // Current player (larger, centered)
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        // Draw player dot
        ctx.beginPath();
        ctx.arc(props.size/2, props.size/2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw direction indicator
        if (typeof player.angle === 'number') {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          const angle = player.angle;
          const endX = (props.size/2) + Math.cos(angle) * 8;
          const endY = (props.size/2) + Math.sin(angle) * 8;
          
          ctx.beginPath();
          ctx.moveTo(props.size/2, props.size/2);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      } else {
        // Other players
        ctx.fillStyle = '#ff0000';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });
  }
};

// Animation loop
const animate = () => {
  try {
    drawMinimap();
  } catch (error) {
    console.warn('Minimap drawing error:', error);
  }
  animationFrame.value = requestAnimationFrame(animate);
};

// Initialize minimap
const initMinimap = () => {
  if (!minimapCanvas.value) return;
  
  minimapCtx.value = minimapCanvas.value.getContext('2d');
  animate();
};

// Watch for game state changes
watch(() => props.gameState, () => {
  // The animation loop will handle redrawing
}, { deep: true });

// Lifecycle
onMounted(() => {
  initMinimap();
});

onUnmounted(() => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value);
  }
});
</script>

<template>
  <div class="minimap-container bg-black/30 border border-green-500 backdrop-blur-sm rounded-lg p-2" :style="containerStyle">
    <canvas 
      ref="minimapCanvas" 
      class="minimap-canvas rounded-lg"
      :width="size" 
      :height="size"
    ></canvas>
    
    <div class="minimap-overlay text-xxs">
      <div class="flex justify-between items-center whitespace-pre -my-1">
        <span class="text-white">Minimap:</span>
        <span class="text-green-400 text-right min-w-[60px]">Active</span>
      </div>
      <div class="flex justify-between items-center whitespace-pre -my-1.5">
        <span class="text-white">Players:</span>
        <span class="text-green-400 text-right min-w-[60px]">{{ playerCount }}</span>
      </div>
      <div class="flex justify-between items-center whitespace-pre -my-1.5">
        <span class="text-white">Items:</span>
        <span class="text-green-400 text-right min-w-[60px]">{{ collectibleCount }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.minimap-container {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  overflow: hidden;
}

.minimap-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.minimap-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 5px;
}
</style>
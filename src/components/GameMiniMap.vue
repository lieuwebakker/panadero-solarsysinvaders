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

// Computed properties
const containerStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`
}));

const playerCount = computed(() => {
  return Object.keys(props.gameState?.players || {}).length;
});

const collectibleCount = computed(() => {
  return Object.keys(props.gameState?.collectibles || {}).length;
});

// Convert world coordinates to minimap coordinates
const worldToMinimap = (worldX, worldY) => {
  const scale = props.size / Math.max(props.worldWidth, props.worldHeight);
  const x = (worldX + props.worldWidth / 2) * scale;
  const y = (worldY + props.worldHeight / 2) * scale;
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

  // Draw collectibles - FIXED: collectibles have direct x/y properties, not position object
  if (props.gameState?.collectibles) {
    ctx.fillStyle = '#ffff00'; // Yellow for collectibles
    Object.values(props.gameState.collectibles).forEach(collectible => {
      // Check if collectible has valid x/y coordinates
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

  // Draw other players with proper null checks
  if (props.gameState?.players) {
    Object.entries(props.gameState.players).forEach(([id, player]) => {
      // Check if player has valid position data
      if (!player || !player.position || 
          typeof player.position.x !== 'number' || 
          typeof player.position.y !== 'number') {
        return; // Skip invalid players
      }

      if (id === props.playerId) {
        // Current player (larger, different color)
        ctx.fillStyle = '#00ff00'; // Green for current player
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
      } else {
        // Other players
        ctx.fillStyle = '#ff0000'; // Red for other players
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
      }

      const pos = worldToMinimap(player.position.x, player.position.y);
      
      // Draw player dot
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, id === props.playerId ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw direction indicator for current player
      if (id === props.playerId && typeof player.angle === 'number') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        const angle = player.angle;
        const endX = pos.x + Math.cos(angle) * 6;
        const endY = pos.y + Math.sin(angle) * 6;
        
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    });
  }

  // Draw safe zones (home positions) with proper null checks
  if (props.gameState?.homePositions) {
    ctx.strokeStyle = '#00ffff'; // Cyan for safe zones
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
    
    ctx.setLineDash([]); // Reset line dash
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
<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import InfoPanel from './ui/InfoPanel.vue';

const props = defineProps({
  items: {
    type: Array,
    required: true,
    // Each item should have: { label: string, value: string|number|function }
  },
  position: {
    type: String,
    default: 'left', // 'left' or 'right'
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

// Count players and collectibles
const playerCount = computed(() => 
  Object.keys(props.gameState?.players || {}).length
);

const collectibleCount = computed(() => 
  Object.keys(props.gameState?.collectibles || {}).length
);

// Info panel items
const minimapInfo = computed(() => [
  {
    label: 'Minimap',
    value: 'Active'
  },
  {
    label: 'Players',
    value: playerCount.value
  },
  {
    label: 'Items',
    value: collectibleCount.value
  }
]);

// ... rest of the canvas drawing code ...
</script>

<template>
  <div 
    class="absolute top-5 bg-black/30 text-green-400 p-2 rounded-lg border border-green-500 backdrop-blur-sm text-xxs"
    :class="position === 'left' ? 'left-5' : 'right-5'"
  >
    <!-- Slot for custom content (like canvas) -->
    <slot></slot>
    
    <!-- Info items -->
    <div 
      v-for="(item, index) in items" 
      :key="index"
      class="flex justify-between items-center whitespace-pre text-xxs -my-1"
    >
      <span class="text-white">{{ item.label }}:</span>
      <span class="text-green-400 text-right min-w-[60px]">
        {{ typeof item.value === 'function' ? item.value() : item.value }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.minimap-container {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  overflow: visible;
}

.minimap-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
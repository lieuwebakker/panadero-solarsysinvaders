<script setup>
import { computed } from 'vue';

const props = defineProps({
  shipInfo: {
    type: Object,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  inSafeZone: {
    type: Boolean,
    default: false
  }
});

// Helper functions
const formatNumber = (num, width) => {
  if (typeof num === 'number') {
    return num.toString().padStart(width, ' ');
  }
  return ''.padStart(width, ' ');
};

const padString = (str, width) => {
  return (str || '').toString().padEnd(width, ' ');
};

// Info items computed property
const infoItems = computed(() => [
  {
    label: 'CallSign',
    value: () => padString(props.shipInfo.callSign, 6)
  },
  {
    label: 'Health',
    value: () => `${formatNumber(props.shipInfo.health, 3)}/${formatNumber(props.shipInfo.maxHealth, 3)}`
  },
  {
    label: 'Position',
    value: () => `${formatNumber(props.shipInfo.position.x, 6)}, ${formatNumber(props.shipInfo.position.y, 6)}`
  },
  {
    label: 'Angle',
    value: () => `${formatNumber(props.shipInfo.angle, 6)}°`
  },
  {
    label: 'Velocity',
    value: () => `${formatNumber(props.shipInfo.velocity.x, 6)}, ${formatNumber(props.shipInfo.velocity.y, 6)}`
  },
  {
    label: 'Home',
    value: () => `${formatNumber(props.shipInfo.home.x, 6)}, ${formatNumber(props.shipInfo.home.y, 6)}`
  },
  {
    label: 'Score',
    value: () => formatNumber(props.score, 6)
  },
  {
    label: 'Pattern',
    value: () => padString(props.shipInfo.pattern, 6)
  },
  {
    label: 'Team',
    value: () => padString(props.shipInfo.color, 6)
  },
  {
    label: 'Safe Zone',
    value: () => props.inSafeZone ? 'Yes' : 'No',
    valueClass: 'text-green-600'
  }
]);
</script>

<template>
  <div class="absolute top-5 left-5 bg-black/30 text-green-400 p-2 rounded-lg border border-green-500 w-32 backdrop-blur-sm text-xxs">
    <div v-for="(item, index) in infoItems" 
         :key="index"
         class="flex justify-between items-center whitespace-pre text-xxs -my-1">
      <span class="text-white">{{ item.label }}:</span>
      <span :class="['text-green-400 text-right min-w-[60px]']">
        {{ item.value() }}
      </span>
    </div>
  </div>
</template> 
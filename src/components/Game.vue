<template>
  <div class="solarsys-game" :class="theme">
    <div class="game-container" ref="gameContainer">
      <div v-if="!isConnected" class="wallet-connect">
        <button @click="connectWallet" class="connect-btn">
          Connect Wallet to Play
        </button>
      </div>
      <div v-else class="canvas-stack" ref="canvasStack">
        <!-- Game canvas will be mounted here -->
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useGameWalletStore } from '../stores/GameWalletStore';
import { CanvasManager } from '../core/Canvas';

export default {
  name: 'SolarSysGame',
  props: {
    theme: {
      type: String,
      default: 'space',
      validator: (value) => ['space', 'atompad', 'moonwealth'].includes(value)
    }
  },
  setup() {
    const gameContainer = ref(null);
    const canvasStack = ref(null);
    const gameWallet = useGameWalletStore();
    const isConnected = ref(false);
    const canvasManager = ref(null);

    onMounted(async () => {
      await gameWallet.initMM();
      
      canvasManager.value = new CanvasManager();
      if (canvasStack.value) {
        Object.values(canvasManager.value.layers).forEach(canvas => {
          canvasStack.value.appendChild(canvas);
        });
      }
    });

    const connectWallet = async () => {
      try {
        const connected = await gameWallet.initialize();
        if (connected) {
          isConnected.value = true;
          // Initialize game after wallet connection
          canvasManager.value.drawStarfield();
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    };

    onUnmounted(() => {
      // Cleanup
      if (canvasManager.value) {
        Object.values(canvasManager.value.layers).forEach(canvas => {
          canvas.remove();
        });
      }
    });

    return {
      gameContainer,
      canvasStack,
      isConnected,
      connectWallet
    };
  }
};
</script>

<style>
.solarsys-game {
  width: 100%;
  height: 100%;
  position: relative;
}

.game-container {
  width: 100%;
  height: 100%;
  background: #000;
  position: relative;
  overflow: hidden;
}

.canvas-stack {
  position: relative;
  width: 100%;
  height: 100%;
}

.wallet-connect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.connect-btn {
  background: #4F46E5;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.connect-btn:hover {
  background: #4338CA;
}
</style>
import { Game } from './components/Game.vue';
import { CanvasManager } from './core/Canvas';
import { useGameWalletStore } from './stores/GameWalletStore';

// Export components and utilities
export { Game, CanvasManager, useGameWalletStore };

// Vue plugin
export default {
  install: (app, options = {}) => {
    // Register components globally
    app.component('SolarSysGame', Game);
  }
}; 
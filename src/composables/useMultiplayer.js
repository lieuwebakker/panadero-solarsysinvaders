import { ref, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

export function useMultiplayer(config = {}) {
    const gameState = ref({
        players: {},
        myShip: null
    });
    const isConnected = ref(false);
    let socket = null;

    const connect = () => {
        if (socket) return;
        
        console.log('[SSI Game] Attempting socket connection...');
        
        // Use configured server URL or fallback to environment variable
        const serverUrl = config.serverUrl || import.meta.env.VITE_WEBSOCKET_SERVER || window.WEBSOCKET_SERVER;
        
        // Try to connect to the game server
        socket = io(serverUrl, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket'],
            ...config.socketOptions
        });

        // Connection events
        socket.on('connect', () => {
            console.log('[SSI Game] Connected! Socket ID:', socket.id);
            isConnected.value = true;
            socket.emit('join_game');
        });

        socket.on('disconnect', () => {
            console.log('[SSI Game] Disconnected from server');
            isConnected.value = false;
            gameState.value = { players: {}, myShip: null };
        });

        socket.on('connect_error', (error) => {
            console.error('[SSI Game] Connection error:', error);
            isConnected.value = false;
        });

        // Game state updates
        socket.on('game_state', (state) => {
            console.log('[SSI Game] Received game state:', state);
            gameState.value = state;
        });
    };

    const sendPlayerInput = (input) => {
        if (!socket?.connected) {
            console.warn('[SSI Game] Cannot send input - not connected');
            return;
        }
        socket.emit('player_input', input);
    };

    onUnmounted(() => {
        if (socket) {
            console.log('[SSI Game] Cleaning up socket connection');
            socket.disconnect();
            socket = null;
        }
    });

    return {
        gameState,
        isConnected,
        connect,
        sendPlayerInput
    };
} 
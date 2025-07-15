import { ref, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

export function useMultiplayer(config = {}) {
    const gameState = ref({
        status: 'init',
        players: {},
        myShip: null
    });
    const isConnected = ref(false);
    let socket = null;

    const connect = () => {
        console.log('=== MULTIPLAYER: Connecting to server ===');
        console.log('Server URL:', config.serverUrl);
        
        socket = io(config.serverUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socket.on('connect', () => {
            console.log('=== MULTIPLAYER: Connected! ===');
            console.log('Socket ID:', socket.id);
            isConnected.value = true;
            gameState.value.status = 'connected';
        });

        socket.on('disconnect', (reason) => {
            console.log('=== MULTIPLAYER: Disconnected ===');
            console.log('Reason:', reason);
            isConnected.value = false;
            gameState.value.status = 'disconnected';
        });

        socket.on('game_state', (state) => {
            console.log('=== MULTIPLAYER: Game state update ===');
            console.log('State:', state);
            gameState.value = state;
        });

        socket.on('error', (error) => {
            console.error('=== MULTIPLAYER: Socket error ===', error);
        });
    };

    const disconnect = () => {
        if (socket) {
            console.log('=== MULTIPLAYER: Manual disconnect ===');
            socket.disconnect();
            socket = null;
        }
    };

    onUnmounted(() => {
        disconnect();
    });

    return {
        gameState,
        isConnected,
        connect,
        disconnect,
        socket: () => socket
    };
} 
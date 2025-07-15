import { ref, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

export function useMultiplayer(config = {}) {
    const gameState = ref({
        status: 'init',
        players: {},
        myShip: null
    });
    const isConnected = ref(false);
    const socket = ref(null);  // Changed to ref

    const connect = () => {
        console.log('=== MULTIPLAYER: Connecting to server ===');
        console.log('Server URL:', config.serverUrl);
        
        socket.value = io(config.serverUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socket.value.on('connect', () => {
            console.log('=== MULTIPLAYER: Connected! ===');
            console.log('Socket ID:', socket.value.id);
            isConnected.value = true;
            gameState.value.status = 'connected';
        });

        socket.value.on('disconnect', (reason) => {
            console.log('=== MULTIPLAYER: Disconnected ===');
            console.log('Reason:', reason);
            isConnected.value = false;
            gameState.value.status = 'disconnected';
        });

        socket.value.on('game_state', (state) => {
            console.log('=== MULTIPLAYER: Game state update ===');
            console.log('State:', state);
            gameState.value = state;
        });

        socket.value.on('error', (error) => {
            console.error('=== MULTIPLAYER: Socket error ===', error);
        });
    };

    const disconnect = () => {
        if (socket.value) {
            console.log('=== MULTIPLAYER: Manual disconnect ===');
            socket.value.disconnect();
            socket.value = null;
        }
    };

    const sendShipState = (shipState) => {
        if (socket.value && isConnected.value) {
            socket.value.emit('ship_state', shipState);
        }
    };

    // Add the sendInput function
    const sendInput = (inputType, value) => {
        if (socket.value && isConnected.value) {
            socket.value.emit('player_input', {
                type: inputType,
                value: value,
                timestamp: Date.now()
            });
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
        sendShipState,
        sendInput,  // Add this to the return object
        socket  // Return the socket ref
    };
} 
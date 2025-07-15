import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.js'),
            name: 'SolarSysGame',
            fileName: (format) => `solarsys-game.${format}.js`
        },
        rollupOptions: {
            external: ['vue', 'socket.io-client'],
            output: {
                globals: {
                    vue: 'Vue',
                    'socket.io-client': 'io'
                }
            }
        }
    }
}); 
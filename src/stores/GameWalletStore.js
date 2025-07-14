import { defineStore } from 'pinia';
import { ref, markRaw } from 'vue';
import { ethers } from 'ethers';

export const useGameWalletStore = defineStore('gameWallet', () => {
    const account = ref("0x0");
    const isMetaMask = ref(false);
    const provider = ref(null);
    const signer = ref(null);
    let initialized = false;

    async function initMM() {
        if (initialized) return;
        
        try {
            if (typeof window !== 'undefined' && window.ethereum) {
                isMetaMask.value = window.ethereum.isMetaMask;
                initialized = true;
            }
        } catch (err) {
            console.warn('GameWalletStore:initMM failed', err);
        }
    }

    async function initialize() {
        await initMM();
        if (!isMetaMask.value) {
            console.warn('MetaMask not installed');
            return false;
        }
        return await fill();
    }

    async function reset() {
        account.value = "0x0";
        provider.value = null;
        signer.value = null;
    }

    async function fill() {
        if (!window?.ethereum) {
            console.warn('Ethereum provider not found');
            return false;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            account.value = accounts[0];
            // Use markRaw to prevent reactivity issues with ethers objects
            provider.value = markRaw(new ethers.BrowserProvider(window.ethereum));
            signer.value = markRaw(await provider.value.getSigner());
            return true;
        } catch (err) {
            console.warn('GameWalletStore:fill failed', err);
            return false;
        }
    }

    // Only set up listeners if we're in a browser environment
    if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.on('accountsChanged', async (accounts) => {
            if (accounts.length > 0) {
                await fill();
            } else {
                await reset();
            }
        });
    }

    return {
        account,
        isMetaMask,
        provider,
        signer,
        initMM,
        initialize,
        reset,
        fill
    };
}); 
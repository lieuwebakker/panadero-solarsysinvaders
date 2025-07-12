import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ethers } from 'ethers';

export const useGameWalletStore = defineStore('gameWallet', () => {
    const account = ref("0x0");
    const isMetaMask = ref(false);
    const provider = ref(null);
    const signer = ref(null);
    
    async function initMM() {
        try {
            isMetaMask.value = ethereum.isMetaMask;
        } catch (err) {
            console.log('GameWalletStore:initMM failed', err);
        }
    }

    async function initialize() {
        if (!isMetaMask.value) {
            throw new Error('MetaMask not installed');
        }
        await fill();
        return true;
    }

    async function reset() {
        account.value = "0x0";
        provider.value = null;
        signer.value = null;
    }

    async function fill() {
        try {
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            account.value = accounts[0];
            provider.value = new ethers.BrowserProvider(window.ethereum);
            signer.value = await provider.value.getSigner();
            return true;
        } catch (err) {
            console.error('GameWalletStore:fill failed', err);
            return false;
        }
    }

    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
        ethereum.on('accountsChanged', async (accounts) => {
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
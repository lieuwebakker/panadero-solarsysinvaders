# Panadero SolarSys Invaders

A space-themed NFT game built by Panadero Services. ioServer added

## Description

SolarSys invaders is an open-world strategy 2D space game that combines NFT exploration, economic simulation, and team combat gameplay. Players can explore the solar system to collect NFTs and resources while engaging in tactical space battles.

## Features

- Multi-layer canvas rendering system
- MetaMask wallet integration
- NFT support
- Real-time multiplayer capabilities
- Resource management system
- Three visual themes: space, atompad, moonwealth

## Installation

```bash
npm install panadero-solarsysinvaders
# or
yarn add panadero-solarsysinvaders
```

## Usage

```javascript
import { createApp } from 'vue';
import SolarSysInvaders from 'panadero-solarsysinvaders';

const app = createApp(App);
app.use(SolarSysInvaders);
```

In your Vue component:

```vue
<template>
  <solar-sys-game theme="space" />
</template>
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## License

MIT 
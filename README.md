# Miden Wallet

<hr />

## ▶️ Install

You can install Miden Wallet right now: https://miden.fi/.

## 🚀 Quick Start

Ensure you have:

- [Node.js](https://nodejs.org) 10 or later installed
- [Yarn](https://yarnpkg.com) v1 or v2 installed

Then run the following:

### 0) Rename .env.example to .env

```bash
mv ./.env.example ./.env
```

### 1) Clone the repository

```bash
git clone https://github.com/demox-labs/miden-wallet.git && cd miden-wallet
```

### 2) Install dependencies

```bash
yarn
```

### 3) Build

Builds the extension for production to the `dist` folder.<br>
It correctly bundles in production mode and optimizes the build for the best performance.

```bash
# for Chrome by default
yarn build
```

Optional for different browsers:

```bash
# for Chrome directly
yarn build:chrome
# for Firefox directly
yarn build:firefox
# for Opera directly
yarn build:opera

# for all at once
yarn build-all
```

## 🧱 Development

```bash
yarn dev
```

Runs the extension in the development mode for Chrome target.<br>
It's recommended to use Chrome for developing.

For testing with the Miden faucet. It is recommended to run a local faucet as we develop against their upcoming release branch. Refer to the [miden-node repo](https://github.com/0xPolygonMiden/miden-node/blob/next/bin/faucet/README.md) for setup

## Testing

```bash
yarn test
```

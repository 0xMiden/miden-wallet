This is currently for leveraging the miden sdk to use its functions outside the context of the wallet extension. It only supports creating notes for a custom faucet right now that can be consumed within the wallet (assuming the wallet RPC is the same)

## Setup

1. Set up your own local rpc
   - Fetch the latest from [miden-node/next](https://github.com/0xPolygonMiden/miden-node/tree/next)
   - Use the makefile command `make docker-build-node` and `make docker-run-node` to start a local rpc
   - Ensure the wallet is hooked up to the same rpc
   - Verify the rpc is the same port as defined in [index.js](index.js)
2. Build the workspace (sdk-debug)
   - ensure yarn has been run in top level miden-wallet directory
   - `yarn`
   - `yarn build`
     - This copies over the sdk dependencies from node_modules into another folder to avoid having to add webpack
   - `yarn start` within sdk-debug
     - Starts the server and provides the webpage to go to
4. Open the webpage
   - Open an **INCOGNITO BROWSER** . The sdk indexedDb needs to be different than the existing wallet one, which can be done by using an incognito window.
   - Add the public key in the form and run
      - This can be found on the hone screen of your miden wallet
   - Browser should download a file for you, please add `.mno` extension at the end
     - TODO: Figure out why it doesnt do this by default / download automatically

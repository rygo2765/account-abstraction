# Smart Wallet with Uniswap Integration

## Common Hardhat Commands:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

## Env Vars
```sh
MAINNET_RPC="https://eth.llamarpc.com"
ARBITRUM_ONE_RPC="https://arbitrum.llamarpc.com"
DEPLOYER_PRIVATE_KEY=""
```

## Development
```sh
pnpm i
npm run test # MAINNET_RPC must be set!
```

## Deployment
```sh
npm run deploy # hardhat network
npm run deploy:arbitrum # arbitrum one 42161
```

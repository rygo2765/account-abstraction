import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.15",
  networks: {
    hardhat: {
      chainId: 1,
      forking: {
        // @ts-ignore
        url: process.env.MAINNET_RPC,
      },
    },
    arbitrumone: {
      url: process.env.ARBITRUM_ONE_RPC,
      chainId: 42161,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
    },
  },
};

export default config;

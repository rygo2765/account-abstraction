import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.15",
  networks:{
    fork: {
      url: process.env.MAINNET_FORK_RPC 
    }
  }
};

export default config;

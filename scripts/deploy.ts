import { ethers } from "hardhat";
import { data } from "./helpers/data";

async function main() {
  // @ts-ignore
  const chainId = +hre.network.config.chainId;
  // @ts-ignore
  const [owner] = await ethers.getSigners();

  const contract = await ethers.deployContract("SmartWallet", [
    owner,
    owner,
    data[chainId].uniRouter,
    data[chainId].weth,
  ]);

  await contract.waitForDeployment();

  // @ts-ignore
  console.log(`SmartWallet with deployed to ${contract.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

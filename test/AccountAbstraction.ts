import { ethers } from "hardhat";
import erc20Abi from "./helpers/erc20.abi.json";
import {
  AccountAbstraction,
  AccountAbstraction__factory,
  MyToken,
  MyToken__factory,
} from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getRoute } from "./helpers/uniswap";
import { USDC_TOKEN, WETH_TOKEN } from "./helpers/token";
import { WETH9 } from "@uniswap/smart-order-router";
import { fromReadableAmount } from "./helpers/conversion";
import { Contract } from "hardhat/internal/hardhat-network/stack-traces/model";

describe("AccountAbstraction", function () {
  let accountAbstraction: AccountAbstraction;
  let accountAbstractionFactory: AccountAbstraction__factory;
  let myToken: MyToken;
  let myTokenFactory: MyToken__factory;
  let weth: any;

  //function to get accounts and deploy all neccessary contracts
  //use loadFixture to reset Hardhat Network to desired state before each test case
  async function deployContracts() {
    //initialize accounts for deploying account abstraction
    const [owner, tokenProvider, ethSender] = await ethers.getSigners();
    weth = new ethers.Contract(WETH_TOKEN.address, erc20Abi, owner);
    //deploy acount abstraction contract using owner account
    accountAbstractionFactory = (await ethers.getContractFactory(
      "AccountAbstraction"
    )) as AccountAbstraction__factory;
    accountAbstraction = await accountAbstractionFactory
      .connect(owner)
      .deploy();

    //deploy ERC20 token contract using tokenProvider account
    myTokenFactory = (await ethers.getContractFactory(
      "MyToken"
    )) as MyToken__factory;
    myToken = await myTokenFactory.connect(tokenProvider).deploy();

    return { owner, tokenProvider, ethSender, accountAbstraction, myToken };
  }

  // it("should have an initial ETH balance of 0", async function () {
  //   const { accountAbstraction } = await loadFixture(deployContracts);
  //   const ethBalance = await ethers.provider.getBalance(
  //     accountAbstraction.getAddress()
  //   );
  //   expect(ethBalance).to.equal(0);
  // });

  // it("should be able to receive ETH", async function () {
  //   const { accountAbstraction, ethSender } = await loadFixture(
  //     deployContracts
  //   );
  //   const deployedAddess = await accountAbstraction.getAddress();

  //   const tx = {
  //     to: deployedAddess,
  //     value: ethers.parseEther("1.0"),
  //   };

  //   await ethSender.sendTransaction(tx);

  //   const ethBalance = await ethers.provider.getBalance(deployedAddess);
  //   expect(ethBalance).to.equal(ethers.parseEther("1.0"));
  // });

  // it("should withdraw the specified amount of ETH", async function () {
  //   const { accountAbstraction, ethSender } = await loadFixture(
  //     deployContracts
  //   );
  //   const deployedAddess = await accountAbstraction.getAddress();

  //   const tx = {
  //     to: deployedAddess,
  //     value: ethers.parseEther("1.0"),
  //   };

  //   await ethSender.sendTransaction(tx);
  //   await accountAbstraction.withdrawEth(ethers.parseEther("0.5"));
  //   const balanceAfter = await ethers.provider.getBalance(deployedAddess);

  //   expect(balanceAfter).to.equal(ethers.parseEther("0.5"));
  // });

  // it("should withdraw the specified amount of ERC20 token", async function () {
  //   const { accountAbstraction, myToken, owner } = await loadFixture(
  //     deployContracts
  //   );

  //   //transfer token to AccountAbstraction contract
  //   const contractAddress = await accountAbstraction.getAddress();

  //   //transfer 100 token to Account Abstraction contract
  //   await myToken.transfer(contractAddress, 100);

  //   //check if transfer is succesful
  //   const balance = await myToken.balanceOf(contractAddress);
  //   expect(balance).to.equal(100);

  //   //withdraw tokens
  //   await accountAbstraction.withdrawTokens(myToken.getAddress(), 50);

  //   //check if withdrawal is succesful
  //   const newBalance = await myToken.balanceOf(contractAddress);
  //   const ownerWalletBalance = await myToken.balanceOf(owner.address);
  //   expect(ownerWalletBalance).to.equal(50);
  //   expect(newBalance).to.equal(50);
  // });

  it("should be able to swap ETH", async function () {
    const { accountAbstraction, ethSender, owner } = await loadFixture(
      deployContracts
    );

    const amountToSwap = 1;

    const deployedAddress = await accountAbstraction.getAddress();
    const tx = {
      to: deployedAddress,
      value: ethers.parseEther((1 * 10).toString()),
    };
    await ethSender.sendTransaction(tx);

    const ethBalanceBefore = await ethers.provider.getBalance(deployedAddress);
    console.log({ ethBalanceBefore });
    const wethBalanceBefore = await weth.balanceOf(deployedAddress);
    console.log({ wethBalanceBefore });
    const usdc = new ethers.Contract(USDC_TOKEN.address, erc20Abi, owner);
    const usdcBalanceBefore = await usdc.balanceOf(deployedAddress);
    console.log({ usdcBalanceBefore });

    const route = await getRoute(
      deployedAddress,
      WETH_TOKEN,
      USDC_TOKEN,
      amountToSwap
    );
    await accountAbstraction.swap(
      WETH_TOKEN.address,
      USDC_TOKEN.address,
      fromReadableAmount(amountToSwap, 18),
      BigInt(0),
      route?.methodParameters?.calldata
    );

    const ethBalanceAfter = await ethers.provider.getBalance(deployedAddress);
    console.log({ ethBalanceAfter });

    const wethBalanceAfter = await weth.balanceOf(deployedAddress);
    console.log({ wethBalanceAfter });
    const usdcBalanceAfter = await usdc.balanceOf(deployedAddress);
    console.log({ usdcBalanceAfter });
  });
});

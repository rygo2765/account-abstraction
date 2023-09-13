import { ethers } from "hardhat";
import { expect } from "chai";
import erc20Abi from "./helpers/erc20.abi.json";
import {
  SmartWallet,
  SmartWallet__factory,
  MyToken,
  MyToken__factory,
} from "../typechain-types";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { getRoute } from "./helpers/uniswap";
import { USDC_TOKEN, WETH_TOKEN } from "./helpers/token";
import { fromReadableAmount } from "./helpers/conversion";

describe("SmartWallet", function () {
  let smartWallet: SmartWallet;
  let smartWalletFactory: SmartWallet__factory;
  let myToken: MyToken;
  let myTokenFactory: MyToken__factory;
  let weth: any;

  //function to get accounts and deploy all neccessary contracts
  //use loadFixture to reset Hardhat Network to desired state before each test case
  async function deployContracts() {
    //initialize accounts for deploying smart wallet
    const [owner, tokenProvider, ethSender, trader, recipient, rando] =
      await ethers.getSigners();
    weth = new ethers.Contract(WETH_TOKEN.address, erc20Abi, owner);
    //deploy acount abstraction contract using owner account
    smartWalletFactory = (await ethers.getContractFactory(
      "SmartWallet"
    )) as SmartWallet__factory;
    smartWallet = await smartWalletFactory
      .connect(owner)
      .deploy(
        owner,
        trader,
        "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
      );

    //deploy ERC20 token contract using tokenProvider account
    myTokenFactory = (await ethers.getContractFactory(
      "MyToken"
    )) as MyToken__factory;
    myToken = await myTokenFactory.connect(tokenProvider).deploy();

    return {
      owner,
      tokenProvider,
      ethSender,
      smartWallet,
      myToken,
      trader,
      recipient,
      rando,
    };
  }

  describe("Permissions", () => {
    describe("Ownership", () => {
      it("should allow owner transfership", async () => {
        const { smartWallet, owner, rando } = await loadFixture(
          deployContracts
        );

        const oldOwner = await smartWallet.owner();
        expect(oldOwner).to.equal(owner.address);
        await smartWallet.transferOwnership(rando);
        const newOwner = await smartWallet.owner();
        expect(newOwner).to.equal(rando.address);
      });

      it("should not allow owner transfership by non-owner", async () => {
        const { smartWallet, owner, rando } = await loadFixture(
          deployContracts
        );

        const oldOwner = await smartWallet.owner();
        expect(oldOwner).to.equal(owner.address);
        await expect(
          smartWallet.connect(rando).transferOwnership(rando)
        ).to.be.revertedWith("Not owner");
        const newOwner = await smartWallet.owner();
        expect(newOwner).to.equal(owner.address);
      });
    });

    describe("Withdrawal", () => {
      it("should allow owner to add to withdrawal whitelist", async () => {
        const { smartWallet, rando } = await loadFixture(deployContracts);

        let isRandoWhitelisted = await smartWallet.withdrawalWhitelist(rando);
        expect(isRandoWhitelisted).to.be.false;
        await smartWallet.addWithdrawalAddress(rando);
        isRandoWhitelisted = await smartWallet.withdrawalWhitelist(rando);
        expect(isRandoWhitelisted).to.be.true;
      });

      it("should not allow non-owner to add to withdrawal whitelist", async () => {
        const { smartWallet, rando } = await loadFixture(deployContracts);

        let isRandoWhitelisted = await smartWallet.withdrawalWhitelist(rando);
        expect(isRandoWhitelisted).to.be.false;
        await expect(
          smartWallet.connect(rando).addWithdrawalAddress(rando)
        ).to.be.revertedWith("Not owner");
        isRandoWhitelisted = await smartWallet.withdrawalWhitelist(rando);
        expect(isRandoWhitelisted).to.be.false;
      });

      it("should allow owner to remove from withdrawal whitelist", async () => {
        const { smartWallet, rando } = await loadFixture(deployContracts);

        await smartWallet.addWithdrawalAddress(rando);
        let isRandoWhitelisted = await smartWallet.withdrawalWhitelist(rando);
        expect(isRandoWhitelisted).to.be.true;
        await smartWallet.removeWithdrawalAddress(rando);
        isRandoWhitelisted = await smartWallet.withdrawalWhitelist(rando);
        expect(isRandoWhitelisted).to.be.false;
      });

      it("should not allow non-owner to remove from withdrawal whitelist", async () => {
        const { smartWallet, owner, rando } = await loadFixture(
          deployContracts
        );

        await expect(
          smartWallet.connect(rando).removeWithdrawalAddress(owner)
        ).to.be.revertedWith("Not owner");
      });

      it("should not allow non-whitelisted address to receive ETH withdrawals", async () => {
        const { smartWallet, owner, rando } = await loadFixture(
          deployContracts
        );

        await expect(
          smartWallet.connect(rando).withdrawEth(BigInt(1000), rando.address)
        ).to.be.revertedWith("Address is not whitelisted");

        await expect(
          smartWallet.connect(owner).withdrawEth(BigInt(1000), rando.address)
        ).to.be.revertedWith("Address is not whitelisted");
      });

      it("should not allow non-whitelisted address to receive ERC20 withdrawals", async () => {
        const { smartWallet, owner, rando } = await loadFixture(
          deployContracts
        );

        await expect(
          smartWallet
            .connect(rando)
            .withdrawTokens(myToken.getAddress(), BigInt(1000), rando.address)
        ).to.be.revertedWith("Address is not whitelisted");

        await expect(
          smartWallet
            .connect(owner)
            .withdrawTokens(myToken.getAddress(), BigInt(1000), rando.address)
        ).to.be.revertedWith("Address is not whitelisted");
      });

      it("should not allow removed whitelisted address to receive ETH withdrawals", async () => {
        const { smartWallet, owner, rando } = await loadFixture(
          deployContracts
        );

        await smartWallet.addWithdrawalAddress(rando);
        await smartWallet.removeWithdrawalAddress(rando);

        await expect(
          smartWallet.connect(rando).withdrawEth(BigInt(1000), rando.address)
        ).to.be.revertedWith("Address is not whitelisted");

        await expect(
          smartWallet.connect(owner).withdrawEth(BigInt(1000), rando.address)
        ).to.be.revertedWith("Address is not whitelisted");
      });

      it("should not allow removed whitelisted address to receive ERC20 withdrawals", async () => {
        const { smartWallet, owner, rando } = await loadFixture(
          deployContracts
        );

        await smartWallet.addWithdrawalAddress(rando);
        await smartWallet.removeWithdrawalAddress(rando);

        await expect(
          smartWallet
            .connect(rando)
            .withdrawTokens(myToken.getAddress(), BigInt(1000), rando.address)
        ).to.be.revertedWith("Address is not whitelisted");

        await expect(
          smartWallet
            .connect(owner)
            .withdrawTokens(myToken.getAddress(), BigInt(1000), rando.address)
        ).to.be.revertedWith("Address is not whitelisted");
      });
    });

    describe("Swap", () => {
      it("should allow owner to add to trader whitelist");

      it("should not allow non-owner to add to trader whitelist");

      it("should allow owner to remove from trader whitelist");

      it("should not allow non-owner to remove from trader whitelist");

      it("should not allow non-trader to swap");
    });
  });

  describe("Withdrawals", () => {
    it("should have an initial ETH balance of 0", async function () {
      const { smartWallet } = await loadFixture(deployContracts);
      const ethBalance = await ethers.provider.getBalance(
        smartWallet.getAddress()
      );
      expect(ethBalance).to.equal(0);
    });

    it("should be able to receive ETH", async function () {
      const { smartWallet, ethSender } = await loadFixture(deployContracts);
      const deployedAddress = await smartWallet.getAddress();

      const tx = {
        to: deployedAddress,
        value: ethers.parseEther("1.0"),
      };

      await ethSender.sendTransaction(tx);

      const ethBalance = await ethers.provider.getBalance(deployedAddress);
      expect(ethBalance).to.equal(ethers.parseEther("1.0"));
    });

    it("should withdraw the specified amount of ETH", async function () {
      const { smartWallet, ethSender, recipient } = await loadFixture(
        deployContracts
      );
      const deployedAddress = await smartWallet.getAddress();
      const withdrawalAmount = 1;
      await smartWallet.addWithdrawalAddress(recipient);

      const tx = {
        to: deployedAddress,
        value: ethers.parseEther((withdrawalAmount * 2).toString()),
      };
      await ethSender.sendTransaction(tx);

      const balanceBefore = await ethers.provider.getBalance(deployedAddress);

      await smartWallet.withdrawEth(
        ethers.parseEther(withdrawalAmount.toString()),
        recipient.address
      );
      const balanceAfter = await ethers.provider.getBalance(deployedAddress);

      const recipientBalance = await ethers.provider.getBalance(
        deployedAddress
      );
      expect(recipientBalance).to.equal(
        ethers.parseEther(withdrawalAmount.toString())
      );

      expect(balanceBefore - balanceAfter).to.equal(
        ethers.parseEther(withdrawalAmount.toString())
      );
    });

    it("should withdraw the specified amount of ERC20 token", async function () {
      const { smartWallet, myToken, owner, recipient } = await loadFixture(
        deployContracts
      );
      await smartWallet.addWithdrawalAddress(recipient);

      //transfer token to SmartWallet contract
      const deployedAddress = await smartWallet.getAddress();

      const amountToMint = 134;
      const amountToWithdraw = 50;
      //transfer 100 token to Smart Wallet contract
      await myToken.transfer(deployedAddress, amountToMint);

      //check if transfer is succesful
      const balance = await myToken.balanceOf(deployedAddress);
      expect(balance).to.equal(amountToMint);

      //withdraw tokens
      await smartWallet.withdrawTokens(
        myToken.getAddress(),
        amountToWithdraw,
        recipient.address
      );

      //check if withdrawal is succesful
      const newBalance = await myToken.balanceOf(deployedAddress);
      const recipientBalance = await myToken.balanceOf(recipient.address);
      expect(recipientBalance).to.equal(amountToWithdraw);
      expect(newBalance).to.equal(amountToMint - amountToWithdraw);
    });
  });

  describe("Swap", () => {
    it("should succeed", async function () {
      const { smartWallet, ethSender, owner, trader } = await loadFixture(
        deployContracts
      );

      const amountToSwap = 1;
      const amountToDeposit = amountToSwap * 10;

      const deployedAddress = await smartWallet.getAddress();
      const tx = {
        to: deployedAddress,
        value: ethers.parseEther(amountToDeposit.toString()),
      };
      await ethSender.sendTransaction(tx);

      const ethBalanceBefore = await ethers.provider.getBalance(
        deployedAddress
      );
      expect(ethBalanceBefore).to.equal(
        ethers.parseEther(amountToDeposit.toString())
      );
      const wethBalanceBefore = await weth.balanceOf(deployedAddress);
      expect(wethBalanceBefore).to.equal(0);
      const usdc = new ethers.Contract(USDC_TOKEN.address, erc20Abi, owner);
      const usdcBalanceBefore = await usdc.balanceOf(deployedAddress);
      expect(usdcBalanceBefore).to.equal(0);

      const route = await getRoute(
        deployedAddress,
        WETH_TOKEN,
        USDC_TOKEN,
        amountToSwap
      );
      await smartWallet
        .connect(trader)
        .swap(
          WETH_TOKEN.address,
          USDC_TOKEN.address,
          fromReadableAmount(amountToSwap, 18),
          BigInt(0),
          route?.methodParameters?.calldata
        );

      const ethBalanceAfter = await ethers.provider.getBalance(deployedAddress);
      expect(ethBalanceAfter).to.equal(ethers.parseEther((0).toString()));

      const wethBalanceAfter = await weth.balanceOf(deployedAddress);
      expect(wethBalanceAfter).to.equal(
        fromReadableAmount(amountToDeposit, 18) -
          fromReadableAmount(amountToSwap, 18)
      );
      const usdcBalanceAfter = await usdc.balanceOf(deployedAddress);
      expect(usdcBalanceAfter).to.be.greaterThan(0);
    });

    it("should fail if less than min out", async function () {
      const { smartWallet, ethSender, owner, trader } = await loadFixture(
        deployContracts
      );

      const amountToSwap = 1;
      const amountToDeposit = amountToSwap * 10;

      const deployedAddress = await smartWallet.getAddress();
      const tx = {
        to: deployedAddress,
        value: ethers.parseEther(amountToDeposit.toString()),
      };
      await ethSender.sendTransaction(tx);

      const ethBalanceBefore = await ethers.provider.getBalance(
        deployedAddress
      );
      expect(ethBalanceBefore).to.equal(
        ethers.parseEther(amountToDeposit.toString())
      );
      const wethBalanceBefore = await weth.balanceOf(deployedAddress);
      expect(wethBalanceBefore).to.equal(0);
      const usdc = new ethers.Contract(USDC_TOKEN.address, erc20Abi, owner);
      const usdcBalanceBefore = await usdc.balanceOf(deployedAddress);
      expect(usdcBalanceBefore).to.equal(0);

      const route = await getRoute(
        deployedAddress,
        WETH_TOKEN,
        USDC_TOKEN,
        amountToSwap
      );
      await expect(
        smartWallet
          .connect(trader)
          .swap(
            WETH_TOKEN.address,
            USDC_TOKEN.address,
            fromReadableAmount(amountToSwap, 18),
            BigInt(9999e18),
            route?.methodParameters?.calldata
          )
      ).to.be.revertedWith("Out amount less than min out");
    });
  });
});

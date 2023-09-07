import { expect } from "chai";
import { ethers } from "hardhat";
import {
  AccountAbstraction,
  AccountAbstraction__factory,
  MyToken,
  MyToken__factory,
} from "../typechain-types";

describe("AccountAbstraction", function () {
  let accountAbstraction: AccountAbstraction;
  let accountAbstractionFactory: AccountAbstraction__factory;
  let myToken: MyToken;
  let myTokenFactory: MyToken__factory;

  beforeEach(async function () {
    accountAbstractionFactory = (await ethers.getContractFactory(
      "AccountAbstraction"
    )) as AccountAbstraction__factory;
    accountAbstraction = await accountAbstractionFactory.deploy();
    // accountAbstraction.deposit({value: 0})
  });

  it("should have an initial ETH balance of 0", async function () {
    const ethBalance = await accountAbstraction.getEthBalance();
    expect(ethBalance).to.equal(0);
  });

  it("should be able to receive ETH", async function () {
    const deployedAddess = await accountAbstraction.getAddress();
    const [owner] = await ethers.getSigners(); //need to change this to use 3rd account

    const tx = {
      to: deployedAddess,
      value: ethers.parseEther("1.0"),
    };

    await owner.sendTransaction(tx); //need to change this to use 3rd account

    const ethBalance = await accountAbstraction.getEthBalance();
    expect(ethBalance).to.equal(ethers.parseEther("1.0"));
  });

  it("should withdraw the specified amount of ETH", async function () {
    const deployedAddess = await accountAbstraction.getAddress();
    const [owner] = await ethers.getSigners(); //need to change this to use 3rd account

    const tx = {
      to: deployedAddess,
      value: ethers.parseEther("1.0"),
    };

    await owner.sendTransaction(tx);

    const balanceBefore = await accountAbstraction.getEthBalance();
    await accountAbstraction.withdrawEth(ethers.parseEther("0.5"));
    const balanceAfter = await accountAbstraction.getEthBalance();
    expect(balanceAfter).to.equal(ethers.parseEther("0.5"));
  });

  it("should withdraw the specified amount of ERC20 token", async function () {
    //deploy ERC20 token contract
    myTokenFactory = (await ethers.getContractFactory(
      "MyToken"
    )) as MyToken__factory;
    myToken = await myTokenFactory.deploy();

    //transfer token to AccountAbstraction contract
    const contractAddress = await accountAbstraction.getAddress();

    //transfer 100 token to Account Abstraction contract
    await myToken.transfer(contractAddress, 100);

    //check if transfer is succesful 
    const balance = await myToken.balanceOf(contractAddress);
    expect(balance).to.equal(100);

    //withdraw tokens
    await accountAbstraction.withdrawTokens(myToken.getAddress(), 50);

    //check if withdrawal is succesful 
    const newBalance = await myToken.balanceOf(contractAddress);
    expect(newBalance).to.equal(50);

    //use ethers.getSigners to get 2 separate address to deploy the AA contract and Token contract
    //check that owner of token contract has 10,000 tokens
    //transfer tokens over to AA contract 
    //withdraw tokens, check if owner account has the tokens now and that the AA contract has reduced by that same amount
  });
});

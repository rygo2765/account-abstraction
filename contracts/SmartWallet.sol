//SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

interface IWETH9 {
    function deposit() external payable;
}

contract SmartWallet is Ownable {
    using SafeERC20 for IERC20;

    address public uniRouter = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;
    address public weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    event TokensWithdrawn(address indexed token, uint256 amount);
    event Swapped(
        address inToken,
        uint256 amount,
        address outToken,
        uint256 actualOut
    );

    //Receive tokens
    receive() external payable {}

    //Function to withdraw ETH
    function withdrawEth(uint256 _amount) external onlyOwner {
        require(
            _amount > 0 && address(this).balance >= _amount,
            "Invalid amount or insufficient balance"
        );
        payable(owner()).transfer(_amount);
    }

    //function to withdraw ERC20 tokens
    function withdrawTokens(
        address _token,
        uint256 _amount
    ) external onlyOwner {
        require(
            _token != address(0) && _amount > 0,
            " Invalid token addess or amount"
        );

        //check the balance of the token in the smart contract
        uint256 balance = IERC20(_token).balanceOf(address(this));

        if (balance < _amount) {
            revert("Insufficient balance");
        }

        IERC20(_token).safeTransfer(owner(), _amount);

        emit TokensWithdrawn(_token, _amount);
    }

    function swap(
        address inToken,
        address outToken,
        uint256 amount,
        uint256 minOut,
        bytes calldata data
    ) external returns (uint256 actualOut) {
        // wrap ETH
        if (inToken == weth && address(this).balance > 0) {
            IWETH9(weth).deposit{value: address(this).balance}();
        }
        uint256 inTokenBefore = IERC20(inToken).balanceOf(address(this));
        console.log("inTokenBefore: ");
        console.log(inTokenBefore);
        uint256 outTokenBefore = IERC20(outToken).balanceOf(address(this));
        console.log("outTokenBefore: ");
        console.log(outTokenBefore);

        // Approve spend
        IERC20(inToken).safeApprove(uniRouter, amount);

        // Swap
        (bool success, ) = address(uniRouter).call{value: 0}(data);
        require(success, "Swap failed");

        // CHECK: actualOut > minOut
        uint256 inTokenAfter = IERC20(inToken).balanceOf(address(this));
        console.log("inTokenAfter: ");
        console.log(inTokenAfter);

        uint256 outTokenAfter = IERC20(outToken).balanceOf(address(this));
        console.log("outTokenAfter: ");
        console.log(outTokenAfter);

        actualOut = outTokenAfter - outTokenBefore;
        console.log("actualOut: ");
        console.log(actualOut);

        uint256 spent = inTokenBefore - inTokenAfter;
        require(actualOut > minOut, "Out amount less than min out");
        require(spent == amount, "Did not spend desired amount");

        emit Swapped(inToken, amount, outToken, actualOut);
    }
}

//SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AccountAbstraction is Ownable {
    using SafeERC20 for IERC20;

    event TokensWithdrawn(address indexed token, uint256 amount);

    //Receive tokens
    receive() external payable {}

    //Function to get ETH balance
    function getEthBalance() public view returns (uint256) {
        return address(this).balance;
    }

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
}

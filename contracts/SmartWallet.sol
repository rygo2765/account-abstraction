//SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IWETH9 {
    function deposit() external payable;

    function withdraw(uint256) external payable;
}

contract SmartWallet {
    using SafeERC20 for IERC20;

    address public owner;
    address public uniRouter = 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45;
    address public weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    mapping(address => bool) public withdrawalWhitelist;
    mapping(address => bool) public traderWhitelist;

    event Swapped(
        address inToken,
        uint256 amount,
        address outToken,
        uint256 actualOut
    );

    constructor(
        address _owner,
        address _trader,
        address _uniRouter,
        address _weth
    ) {
        owner = _owner;
        traderWhitelist[_trader] = true;
        uniRouter = _uniRouter;
        weth = _weth;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyTrader() {
        require(traderWhitelist[msg.sender], "Not trader");
        _;
    }

    receive() external payable {}

    function transferOwnership(address _address) external onlyOwner {
        require(_address != address(0), "Invalid address");
        owner = _address;
    }

    function addWithdrawalAddress(address _address) external onlyOwner {
        require(_address != address(0), "Invalid address");
        require(
            !withdrawalWhitelist[_address],
            "Address is already whitelisted"
        );
        withdrawalWhitelist[_address] = true;
    }

    function removeWithdrawalAddress(address _address) external onlyOwner {
        require(withdrawalWhitelist[_address], "Address is not whitelisted");
        withdrawalWhitelist[_address] = false;
    }

    function isWhitelistedForWithdrawal(
        address _address
    ) public view returns (bool) {
        return withdrawalWhitelist[_address];
    }

    function withdrawEth(uint256 amount, address to) external {
        require(isWhitelistedForWithdrawal(to), "Address is not whitelisted");
        require(
            amount > 0 && address(this).balance >= amount,
            "Invalid amount or insufficient balance"
        );
        payable(to).transfer(amount);
    }

    function withdrawTokens(
        address token,
        uint256 amount,
        address to
    ) external {
        require(isWhitelistedForWithdrawal(to), "Address is not whitelisted");
        require(
            token != address(0) && amount > 0,
            " Invalid token addess or amount"
        );
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "Insufficient balance");

        if (token == weth) {
            IWETH9(weth).withdraw(amount);
            this.withdrawEth(amount, to);
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    function addTraderAddress(address _address) external onlyOwner {
        require(_address != address(0), "Invalid address");
        require(!traderWhitelist[_address], "Address is already whitelisted");
        traderWhitelist[_address] = true;
    }

    function removeTraderAddress(address _address) external onlyOwner {
        require(traderWhitelist[_address], "Address is not whitelisted");
        traderWhitelist[_address] = false;
    }

    function isWhitelistedTrader(address _address) public view returns (bool) {
        return traderWhitelist[_address];
    }

    function swap(
        address inToken,
        address outToken,
        uint256 amount,
        uint256 minOut,
        bytes calldata data
    ) external onlyTrader returns (uint256 actualOut) {
        if (inToken == weth && address(this).balance > 0) {
            IWETH9(weth).deposit{value: address(this).balance}();
        }
        uint256 inTokenBefore = IERC20(inToken).balanceOf(address(this));
        uint256 outTokenBefore = IERC20(outToken).balanceOf(address(this));

        IERC20(inToken).safeApprove(uniRouter, amount);

        (bool success, ) = address(uniRouter).call{value: 0}(data);
        require(success, "Swap failed");

        uint256 inTokenAfter = IERC20(inToken).balanceOf(address(this));
        uint256 outTokenAfter = IERC20(outToken).balanceOf(address(this));
        actualOut = outTokenAfter - outTokenBefore;
        uint256 spent = inTokenBefore - inTokenAfter;
        require(actualOut > minOut, "Out amount less than min out");
        require(spent == amount, "Did not spend desired amount");

        emit Swapped(inToken, amount, outToken, actualOut);
    }
}

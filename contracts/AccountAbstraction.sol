//SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

contract AccountAbstraction is Ownable {
    using SafeERC20 for IERC20;

    address public universalRouterAddress =
        0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD;

    event TokensWithdrawn(address indexed token, uint256 amount);

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

    //function to swap tokens
    // function swap(
    //     address inToken,
    //     address outToken,
    //     uint256 amount,
    //     uint256 minOut,
    //     bool isEthSwap,
    //     bytes calldata _data
    // ) external onlyOwner returns (uint256 actualOut) {

    //     address uniswapRouterContractAddress = 0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD;

    // }

    function swapEth(
        uint256 amountIn,
        uint256 amountOutMin,
        address token
    ) external onlyOwner {
        console.log(amountIn);
        console.log(amountOutMin);
        //Prepare the token path (ETH to MATIC)
        address[] memory path = new address[](2);
        path[0] = address(0);
        path[1] = token;

        //Encode the parameters
        bytes memory data = abi.encodeWithSelector(
            bytes4(keccak256("execute(bytes,bytes[])")),
            bytes1(0x00),
            abi.encode(
                address(this), //Recipient
                amountIn, //Amount of Eth to swap
                amountOutMin, //Minimum MATIC you expect to receive
                path, //Token path
                address(this) //payer is the user
            )
        );

        (bool success, ) = universalRouterAddress.call{value: amountIn}(data);
        console.log(success);
        // require(success, "Swap failed");
    }
}

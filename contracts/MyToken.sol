//SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20{
    constructor() ERC20("MyToken", "MYT"){
        //Mint an initial supply of tokens to the contract creator
        _mint(msg.sender, 10000 * 10**decimals());
    }
}
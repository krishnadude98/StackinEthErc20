// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GoofyGoober is ERC20 {
    uint constant _initial_supply = 100 * (10 ** 18);

    constructor(address stacking) ERC20("GoofyGoober", "GG") {
        _mint(stacking, _initial_supply);
    }
}

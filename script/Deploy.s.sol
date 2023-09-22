// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {PhilosophersStone} from "../src/PhilosophersStone.sol";
import {ImmutableCreate2Deployer} from "./ImmutableCreate2Deployer.sol";

contract Deploy is ImmutableCreate2Deployer {

    function run() public {
        register(
            "PhilosophersStone",
            bytes32(0x5a647cbb7a663ca63b039f276bf634f6d82db32375b120db4ecf562dfb1daae4),
            type(PhilosophersStone).creationCode
        );
        deploy();
    }
}

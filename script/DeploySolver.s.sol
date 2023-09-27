// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import { Script } from "forge-std/Script.sol";

import { Beacon, Solver } from "../src/Solver.sol";

contract DeploySolver is Script {
  function run() external {
    vm.startBroadcast();
    Beacon beacon = new Beacon{ salt: "" }();
    beacon.setSalt(
      bytes32(0x07d42ac51f7189fe3ea150776435928427e37016e50d38f22c9e1d832453cbcb)
    );
    beacon.setMagic(bytes4(0x0226170d));
    Solver s = new Solver{salt: ""}(beacon);
  }
}

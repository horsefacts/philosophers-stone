// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

contract Beacon {
  bytes4 magic;
  bytes32 salt;

  function getMagic() external view returns (bytes4) {
    return magic;
  }

  function setMagic(bytes4 _magic) external {
    magic = _magic;
  }

  function getSalt() external view returns (bytes32) {
    return salt;
  }

  function setSalt(bytes32 _salt) external {
    salt = _salt;
  }
}

interface IBeacon {
  function getMagic() external view returns (bytes4);
}

contract SolSolver {
  function destroy() external {
    selfdestruct(payable(msg.sender));
  }

  fallback(bytes calldata) external returns (bytes memory) {
    return abi.encode(
      IBeacon(address(0xC203e79F4Eec7CF5933d8c62C6a9772e50518092)).getMagic()
    );
  }
}

contract Solver {
  constructor(Beacon beacon) {
    bytes32 salt = beacon.getSalt();
    bytes memory extraBytes = bytes.concat(hex"00", abi.encodePacked(salt));
    bytes memory byteCode = bytes.concat(
      hex"608060405234801561001057600080fd5b506004361061002b5760003560e01c"
      hex"806383197ef0146100d8575b600036606073"
      hex"C203e79F4Eec7CF5933d8c62C6a9772e50518092"
      hex"6001600160a01b031663eea32eb26040518163ffffffff1660e0"
      hex"1b8152600401602060405180830381865afa158015610082573d6000803e3d60"
      hex"00fd5b505050506040513d601f19601f820116820180604052508101906100a6"
      hex"91906100e0565b604080516001600160e01b0319909216602083015201604051"
      hex"6020818303038152906040529050915050805190602001f35b6100de33ff5b00"
      hex"5b6000602082840312156100f257600080fd5b81516001600160e01b03198116"
      hex"811461010a57600080fd5b939250505056fea2646970667358221220a12ccf63"
      hex"17029c40f1b4aa2177fefb847f4915ff863a1e2079f724b968160f6e64736f6c"
      hex"63430008150033",
      extraBytes
    );
    assembly {
      return(add(byteCode, 0x20), mload(byteCode))
    }
  }
}

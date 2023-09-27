import { providers, Wallet, Contract, PopulatedTransaction } from "ethers";
import {
  FlashbotsBundleProvider,
  FlashbotsTransactionResponse,
} from "@flashbots/ethers-provider-bundle";
import { getCreate2Address, parseUnits, solidityPack } from "ethers/lib/utils";

const provider = new providers.JsonRpcProvider(process.env.RPC_URL);
const account = new Wallet(process.env.PRIVATE_KEY, provider);
const authSigner = Wallet.createRandom();

const MAX_FEE_PER_GAS = parseUnits("12", "gwei");
const PRIORITY_FEE = parseUnits("1", "gwei");

const PUZZLE = "0x1A262F7BC318018E47346a539f5445F2A944f02D";
const puzzleAbi = [
  "function transmute(uint256 materia) external",
  "function solve() external",
  "function coagula() external",
  "function verify(uint256 _start, uint256 _solution) external view returns (bool)",
  "function generate(address _seed) external view returns (uint256)",
];

const BEACON = "0xC203e79F4Eec7CF5933d8c62C6a9772e50518092";
const beaconAbi = [
  "function setMagic(bytes4 _magic) external",
  "function setSalt(bytes32 _salt) external",
];

const LEAD_SALT =
  "0x0a0bf245d32cd58eab0f32d79c64fddec5470f69d7d7704619227c222eede264";
const GOLD_SALT =
  "0xa0248e5a3d7bce9707abe35352ad125e3220554dee98d5e74576b57c13bcfcf4";

const ELIXIR_INITCODE_HASH =
  "0xcc3e599f816f743920ce9b61ae6bf225412023fb14efd3d0f82eb71138020b33";
const elixirAbi = ["function distill() external"];

const SOLVER = "0xDcCC28C3B94946A6AC8a91B3Cf0144ca6a90D5ac";
const solverAbi = ["function destroy() external"];

const SIGIL_UPPER_BITS = "0x226170db312b1789a1db4840b7b81c4";
const SIGIL_LOWER_BITS = "0xf51d8e4c7eb7e59d368ca95fec093ca3";

function getSalt(blockNumber, sigilBits) {
  return solidityPack(["uint128", "uint128"], [blockNumber, sigilBits]);
}

function predictAddress(blockNumber, sigilBits) {
  return getCreate2Address(
    PUZZLE,
    getSalt(blockNumber, sigilBits),
    ELIXIR_INITCODE_HASH
  );
}

function wrapTx(tx: PopulatedTransaction) {
  return {
    ...tx,
    chainId: 5,
    type: 2,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: PRIORITY_FEE,
    gasLimit: 1_000_000,
  };
}

async function main() {
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider,
    authSigner,
    "https://relay-goerli.flashbots.net",
    "goerli"
  );

  let landed = false;
  while (!landed) {
    const currentBlock = await provider.getBlockNumber();
    const targetBlockNumber = currentBlock + 1;

    const elixir1Addr = predictAddress(targetBlockNumber, SIGIL_LOWER_BITS);
    const elixir2Addr = predictAddress(targetBlockNumber, SIGIL_UPPER_BITS);

    const puzzle = new Contract(PUZZLE, puzzleAbi, account);
    const elixir1 = new Contract(elixir1Addr, elixirAbi, account);
    const solver = new Contract(SOLVER, solverAbi, account);
    const beacon = new Contract(BEACON, beaconAbi, account);
    const elixir2 = new Contract(elixir2Addr, elixirAbi, account);

    const bundle = [
      {
        signer: account,
        transaction: wrapTx(await puzzle.populateTransaction.transmute(SOLVER)),
      },
      {
        signer: account,
        transaction: wrapTx(await puzzle.populateTransaction.solve()),
      },
      {
        signer: account,
        transaction: wrapTx(await elixir1.populateTransaction.distill()),
      },
      {
        signer: account,
        transaction: wrapTx(await solver.populateTransaction.destroy()),
      },
      {
        signer: account,
        transaction: wrapTx(
          await beacon.populateTransaction.setSalt(GOLD_SALT)
        ),
      },
      {
        signer: account,
        transaction: wrapTx(
          await beacon.populateTransaction.setMagic("0xb312b178")
        ),
      },
      {
        signer: account,
        transaction: wrapTx({
          data: "0x0000000000000000000000000000000000000000000000000000000000000000608060405234801561001057600080fd5b5060405161032c38038061032c83398101604081905261002f91610104565b6000816001600160a01b03166313a9589c6040518163ffffffff1660e01b8152600401602060405180830381865afa15801561006f573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100939190610134565b90506000816040516020016100aa91815260200190565b60408051601f19818403018152908290526100c79160200161017d565b60405160208183030381529060405290506000816040516020016100eb9190610190565b6040516020818303038152906040529050805160208201f35b60006020828403121561011657600080fd5b81516001600160a01b038116811461012d57600080fd5b9392505050565b60006020828403121561014657600080fd5b5051919050565b6000815160005b8181101561016e5760208185018101518683015201610154565b50600093019283525090919050565b60008152600061012d600183018461014d565b7f608060405234801561001057600080fd5b506004361061002b5760003560e01c81527f806383197ef0146100d8575b600036606073c203e79f4eec7cf5933d8c62c6a960208201527f772e505180926001600160a01b031663eea32eb26040518163ffffffff1660e060408201527f1b8152600401602060405180830381865afa158015610082573d6000803e3d6060608201527efd5b505050506040513d601f19601f820116820180604052508101906100a660808201527f91906100e0565b604080516001600160e01b031990921660208301520160405160a08201527f6020818303038152906040529050915050805190602001f35b6100de33ff5b0060c08201527f5b6000602082840312156100f257600080fd5b81516001600160e01b0319811660e08201527f811461010a57600080fd5b939250505056fea2646970667358221220a12ccf636101008201527f17029c40f1b4aa2177fefb847f4915ff863a1e2079f724b968160f6e64736f6c610120820152666343000815003360c81b610140820152600061012d61014783018461014d56fe000000000000000000000000c203e79f4eec7cf5933d8c62c6a9772e50518092",
          to: "0x4e59b44847b379578588920cA78FbF26c0B4956C",
          from: "0x79b60aE68b4FeFFcB306c2BD7Adb44b2a4E35924",
        }),
      },
      {
        signer: account,
        transaction: wrapTx(await puzzle.populateTransaction.coagula()),
      },
      {
        signer: account,
        transaction: wrapTx(await elixir2.populateTransaction.distill()),
      },
    ];
    const signedTransactions = await flashbotsProvider.signBundle(bundle);
    const simulation = await flashbotsProvider.simulate(
      signedTransactions,
      targetBlockNumber
    );
    console.log(JSON.stringify(simulation, null, 2));

    const sendBundle = false;

    if (sendBundle) {
      const flashbotsTransactionResponse =
        (await flashbotsProvider.sendRawBundle(
          signedTransactions,
          targetBlockNumber
        )) as FlashbotsTransactionResponse;
      console.log(flashbotsTransactionResponse);
      const status = await flashbotsTransactionResponse.wait();
      console.log("status:", status);
      if (status === 0) {
        landed = true;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

main();

const Bridge = artifacts.require("Bridge");
const HashDaoToken = artifacts.require("HashDaoToken");
const HashUSDToken = artifacts.require("HashUSDToken");
const WrappedAssetToken = artifacts.require("WrappedAssetToken");
const BridgeState = artifacts.require("BridgeState");
const BigNumber = require("bignumber.js");

const ENV = require("../ENV.json");

module.exports = async function (deployer, network, accounts) {
  // These are hardcoded initial relayers as per Testnet Impl. The private keys of these relayers are public. These are meant for testing purposes.
  const relayers = ENV.relayers;
  let networkId;

  if (network in ENV.networks) {
    networkId = ENV.networks[network];
  } else {
    console.error("please configure network " + network);
    process.exit(1);
  }
  console.log(`Trying to deploy to ${network} with network id ${networkId}`);
  console.log("relayers", relayers);
  console.log("Hash DAO Token");
  await deployer.deploy(HashDaoToken, "Hash DAO Token", "HDAO");
  const token1 = await HashDaoToken.deployed();
  console.log("Hash USD Token");
  await deployer.deploy(HashUSDToken, "Hash USD Token", "HUSD");
  const token2 = await HashUSDToken.deployed();

  console.log("Deploying BridgeState start");
  await deployer.deploy(
    BridgeState,
    [relayers[0], relayers[1], relayers[2]],
    [
      token1.address,
      token2.address,
      "0x0000000000000000000000000000000000000000",
    ],
    2
  );
  const bridgeStateInstance = await BridgeState.deployed();
  console.log("BridgeState Deployed");

  await deployer.deploy(Bridge, networkId, bridgeStateInstance.address);
  console.log("Bridge Start");
  const bridge = await Bridge.deployed();
  console.log("Bridge Deployed");

  // This is the first example of a foreign asset wrapped on Ethereum chain.
  console.log("Wrapped Asset Token Contract");
  await deployer.deploy(
    WrappedAssetToken,
    "Hash Wrapped Algorand",
    "HALGO",
    bridge.address,
    6
  );

  const decimals = new BigNumber(10).pow(new BigNumber(18));
  const amount = new BigNumber(100).multipliedBy(decimals);

  await token1.mintNew();
  await token2.mintNew();

  await token1.transfer(bridge.address, amount);
  await token2.transfer(bridge.address, amount);
};

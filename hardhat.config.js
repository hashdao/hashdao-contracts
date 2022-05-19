require("@nomiclabs/hardhat-waffle");
//require("hardhat-gas-reporter");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  gasReporter: {
    currency: "USD",
    enabled: true,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    alice: {
      default: 1,
    },
    bob: {
      default: 2,
    },
    carol: {
      default: 3,
    },
  },
  networks: {
    localhost: {
      live: false,
      saveDeployments: true,
      tags: ["local"],
    },
    hardhat: {
      forking: {
        enabled: true,
        url: "https://eth-mainnet.alchemyapi.io/v2/N0JsuN6vtGzZkmbw64k4kJo5KjDjNWxU",
        blockNumber: 12886725,
      },
      allowUnlimitedContractSize: true,
      live: false,
      saveDeployments: true,
      tags: ["test", "local"],
    },
    rinkeby: {
      url: "https://eth-rinkeby.alchemyapi.io/v2/pqnnlw_UGZGadM2cwh1J4VbQ2Hhjnjj3",
      accounts: ["4c4e299fb2d036957c627327e70af3d8ba1df97d50828978c912960c0ebff653", "4c89db7da0ce19e2ba2a68622f2c89936118486074ce4b44662130359e972cbc"],
      blockNumber: 12886725,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.11",
        settings: {
          optimizer: {
            enabled: true,
            runs: 3333,
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 200000,
  },
};

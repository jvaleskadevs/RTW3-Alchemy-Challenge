require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config()

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  solidity: "0.8.17",
  networks: {
  	optimism: {
  		url: process.env.OPTIMISM_URL,
  		accounts: [process.env.OPTIMISM_PRIVATE_KEY]
  	}
  },
  etherscan: {
  	apiKey: {
  		optimisticGoerli: process.env.ETHERSCAN_API_KEY
	}
  }
};

require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')
require('dotenv').config()

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
        blockNumber: 14670000,
      },
      chainId: 1,
      initialBaseFeePerGas: 5,
      loggingEnabled: false,
      allowUnlimitedContractSize: false,
      blockGasLimit: 50000000,
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : { mnemonic: 't t t t t t t t t t t junk' },
      timeout: 2147483647,
    },
  },
}

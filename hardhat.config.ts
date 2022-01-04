import { HardhatUserConfig } from 'hardhat/config'
import { getEnvConfig, networkConfig } from './utils/config-loader'

import '@nomiclabs/hardhat-truffle5'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-web3'
import '@nomiclabs/hardhat-etherscan'
import "@tenderly/hardhat-tenderly"

import 'hardhat-gas-reporter'
import 'solidity-coverage'

const ganacheNetwork = {
  url: 'http://127.0.0.1:8545',
  blockGasLimit: 6000000000
}

const envConfig = getEnvConfig('PROD')

const config: HardhatUserConfig = {
  solidity: {
    version: '0.7.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999,
        details: {
          yul: true
        }
      }
    }
  },
  paths: {
    root: 'src',
    tests: '../tests'
  },
  defaultNetwork: "rinkeby",
  networks: {
    mainnet: networkConfig('mainnet'),
    rinkeby: networkConfig('rinkeby'),
    ganache: ganacheNetwork,
    coverage: {
      url: 'http://localhost:8555'
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: networkConfig('mainnet').etherscan
  },
  mocha: {
    timeout: 150000
  },
  gasReporter: {
    enabled: !!process.env.REPORT_GAS === true,
    currency: 'USD',
    gasPrice: 21,
    showTimeSpent: true
  },
  tenderly: {
    project: envConfig['TENDERLY_PROJECT_NAME'],
    username: envConfig['TENDERLY_ACCOUNT_NAME'],
  }
}

export default config

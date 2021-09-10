import { network } from 'hardhat'
import * as _ from 'lodash'
import ora from 'ora'

import {
  LootFamiliars__factory
} from '../gen/typechain'

import { UniversalDeployer } from '@0xsequence/deployer'
import { BigNumber, providers } from 'ethers'
import { attempVerify, buildNetworkJson } from '../../utils/deployments'
import fs from 'fs'

const prompt = ora()

/**
 * @notice Deploy contract via universal deployer
 */

const provider = new providers.Web3Provider(network.provider.send)
const signer = provider.getSigner()
const universalDeployer = new UniversalDeployer(network.name, signer.provider)
const txParams = {
  gasLimit: 6000000,
  gasPrice: BigNumber.from(10)
    .pow(9)
    .mul(16)
}

const main = async () => {
  prompt.info(`Network Name:           ${network.name}`)
  prompt.info(`Local Deployer Address: ${await signer.getAddress()}`)
  prompt.info(`Local Deployer Balance: ${await signer.getBalance()}`)

  // Deploying contracts
  const lootFamiliars = await universalDeployer.deploy('LootFamiliars', LootFamiliars__factory, txParams)

  // Logger
  prompt.start(`writing deployment information to ${network.name}.json`)
  fs.writeFileSync(`./src/networks/${network.name}.json`, JSON.stringify(buildNetworkJson(
    { name: "LootFamiliars", address: lootFamiliars.address },
  ), null, 2))
  prompt.succeed()

  // Verifying contracts via Tenderly
  prompt.start(`verifying contracts`)
  await attempVerify("LootFamiliars", LootFamiliars__factory, lootFamiliars.address)

  prompt.succeed()
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

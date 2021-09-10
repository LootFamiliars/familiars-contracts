import { network } from 'hardhat'
import { providers } from 'ethers'
import { LootFamiliars__factory } from '../../src/gen/typechain'
import {PassThrough as PassThroughStream} from 'node:stream';
import * as fs from "fs";
import ora from 'ora'

const FAMILIARV1_ADDRESS = '0x6686461fd93399af5d08a9590f4fa87d734afb43'
const CHAIN_ID = 1

const provider = new providers.Web3Provider(network.provider.send, CHAIN_ID)
const signer = provider.getSigner()
const familiars = LootFamiliars__factory.connect(FAMILIARV1_ADDRESS, signer)
const spinner = ora().start();

type LootID = {
  ownerAddress: string,
  lootID: number
}

const main = async () => {
  // Get # of familiars that exist
  const n_familiars = (await familiars.totalSupply()).toNumber()

  // Array of all familiars that are already claimed
  let ownedIDs: LootID[] = []
  for (let i = 0; i < n_familiars; i++) {
    spinner.text = `Fetching Familiars... ${i}/${n_familiars}`
    const lootID = (await familiars.tokenByIndex(i)).toNumber()
    
    try {
      const ownerAddress = await familiars.ownerOf(lootID)
      if (ownerAddress) {
        ownedIDs.push({ownerAddress, lootID})
      }
    } catch (e) {
      // Skip
    }
  }

  fs.writeFileSync('src/output/mintedFamiliarsV1.json', JSON.stringify(ownedIDs, null, 2))
  console.log(ownedIDs)
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })

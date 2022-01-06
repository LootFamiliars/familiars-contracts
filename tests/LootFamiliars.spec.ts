import * as ethers from 'ethers'
import { expect, RevertError} from './utils'

import { LootFamiliars, LootFamiliarsV1 } from 'src/gen/typechain'
const mintedV1Familiars = require('../src/output/mintedFamiliarsV1.json')

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

// Importing contract artifacts
const FamiliarsV1Artifact = artifacts.require('LootFamiliarsV1')
const FamiliarsArtifact = artifacts.require('LootFamiliars')

// Constants to use
const UNMINTED_IDS = [1, 23, 77, 86, 666]
const MINT_COST = ethers.utils.parseUnits("0.2", "ether")

contract('LootFamiliars', () => {
  let familiarV1: LootFamiliarsV1
  let familiarV2: LootFamiliars

  // Get reserved IDs
  const v1_ids: number[] = []
  const v1_owners: string[] = []
  mintedV1Familiars.forEach( (familiar, idx) => {
    if (idx < 5) {
      v1_ids.push(familiar.lootID)
      v1_owners.push(familiar.ownerAddress)
    }
  })

  beforeEach(async () => {
    // Deploy contract
    familiarV1 = await FamiliarsV1Artifact.new()
    familiarV2 = await FamiliarsArtifact.new(familiarV1.address)
    
    // Mint all familiars V1 to owners
    await familiarV1.testMint(v1_ids, v1_owners)
  })

  describe('familiarV2.isClaimable()', () => {
    it(`should return true if familiar has not been claimed yet`, async () => {
      UNMINTED_IDS.forEach(async (id) => {
        const isClaimable = await familiarV2.isClaimable(id)
        expect(isClaimable).to.be.true
      })
    })

    it(`should return false if familiar has been claimed`, async () => {
      UNMINTED_IDS.forEach(async (id) => {
        await familiarV2.mint(id, {value: MINT_COST})
        const isClaimable = await familiarV2.isClaimable(id)
        expect(isClaimable).to.be.false
      })
    })

    it(`should return false if familiar is reserved for V1 familiar`, async () => {
      v1_ids.forEach(async (id) => {
        const isClaimable = await familiarV2.isClaimable(id)
        expect(isClaimable).to.be.false
      })
    })
  })

  describe('familiarV2.findClaimable()', () => {
    it(`should IDs that are not reserved`, async () => {
      const claimables = await familiarV2.findClaimable(1, 2000)
      claimables.forEach(id => {
        expect(v1_ids.includes(id.toNumber())).to.be.false
      })
    })

    it(`should return IDs that have not been minted on V2`, async () => {
      const pre_claimables = await familiarV2.findClaimable(1, 2000)
      await familiarV2.multiMint(UNMINTED_IDS, {value: MINT_COST.mul(UNMINTED_IDS.length)})
      const post_claimables = await familiarV2.findClaimable(1, 2000)
      const diff = pre_claimables.filter(id => id.toNumber() != 0).length - post_claimables.filter(id => id.toNumber() != 0).length
      
      expect(diff).to.be.eql(UNMINTED_IDS.filter(id => id < 2000).length)
      post_claimables.forEach(id => {
        expect(UNMINTED_IDS.includes(id.toNumber())).to.be.false
      })
    })
  })

  describe('familiarV2.mint()', () => {
    it(`Should throw if not mint ID is out of range`, async () => {
      const tx = familiarV2.mint(8001, {value: MINT_COST})
      await expect(tx).to.be.rejectedWith(RevertError('Token ID invalid'))
    })

    it(`Should throw if not enough funds are sent`, async () => {
      UNMINTED_IDS.forEach(async (id) => {
        const tx = familiarV2.mint(id, {value: MINT_COST.sub(1)})
        await expect(tx).to.be.rejectedWith(RevertError('Ether amount sent is insufficient'))
      })
    })

    it(`Should throw if familiar is already minted`, async () => {
      UNMINTED_IDS.forEach(async (id) => {
        await familiarV2.mint(id, {value: MINT_COST})
      })
      UNMINTED_IDS.forEach(async (id) => {
        const tx = familiarV2.mint(id, {value: MINT_COST})
        await expect(tx).to.be.rejectedWith(RevertError('Familiar has already been minted'))
      })
    })

    it(`Should throw if familiar is reserved for V1`, async () => {
      v1_ids.forEach(async (id) => {
        const tx = familiarV2.mint(id, {value: MINT_COST})
        await expect(tx).to.be.rejectedWith(RevertError('Familiar is reserved for V1 familiar owner'))
      })
    })

    it(`Should be successful otherwise`, async () => {
      UNMINTED_IDS.forEach(async (id) => {
        const tx = familiarV2.mint(id, {value: MINT_COST})
        await expect(tx).to.be.fulfilled

        const owner = await familiarV2.ownerOf(id)
        expect(owner).to.be.eql(await familiarV2.owner())
      })
    })
  })

  describe('familiarV2.multiMint()', () => {
    it(`Should throw if not mint ID is out of range`, async () => {
      const tx = familiarV2.multiMint([8001], {value: MINT_COST})
      await expect(tx).to.be.rejectedWith(RevertError('Token ID invalid'))
    })

    it(`Should throw if not enough funds are sent`, async () => {
      const tx = familiarV2.multiMint(UNMINTED_IDS, {value: MINT_COST.mul(UNMINTED_IDS.length).sub(1)})
      await expect(tx).to.be.rejectedWith(RevertError('Ether amount sent is insufficient'))
      
      UNMINTED_IDS.forEach(async (id) => {
        const tx = familiarV2.multiMint([id], {value: MINT_COST.sub(1)})
        await expect(tx).to.be.rejectedWith(RevertError('Ether amount sent is insufficient'))
      })
    })

    it(`Should throw if familiar is already minted`, async () => {
      // Mint these familiar once
      await familiarV2.multiMint(UNMINTED_IDS, {value: MINT_COST.mul(UNMINTED_IDS.length)})
      
      // Try to mint these familiar again
      const tx = familiarV2.multiMint(UNMINTED_IDS, {value: MINT_COST.mul(UNMINTED_IDS.length)})
      await expect(tx).to.be.rejectedWith(RevertError('Familiar has already been minted'))
    
      UNMINTED_IDS.forEach(async (id) => {
        const tx = familiarV2.multiMint([id], {value: MINT_COST})
        await expect(tx).to.be.rejectedWith(RevertError('Familiar has already been minted'))
      })
    })

    it(`Should throw if familiar is reserved for V1`, async () => {
      // Try to mint these familiar again
      const tx = familiarV2.multiMint(v1_ids, {value: MINT_COST.mul(v1_ids.length)})
      await expect(tx).to.be.rejectedWith(RevertError('Familiar is reserved for V1 familiar owner'))
      
      v1_ids.forEach(async (id) => {
        const tx = familiarV2.multiMint([id], {value: MINT_COST})
        await expect(tx).to.be.rejectedWith(RevertError('Familiar is reserved for V1 familiar owner'))
      })
    })

    it(`Should be successful otherwise`, async () => {
      const tx = familiarV2.multiMint(UNMINTED_IDS, {value: MINT_COST.mul(UNMINTED_IDS.length)})
      await expect(tx).to.be.fulfilled

      UNMINTED_IDS.forEach(async (id) => {
        const owner = await familiarV2.ownerOf(id)
        expect(owner).to.be.eql(await familiarV2.owner())
      })
    })
  })

  describe('familiarV2.airdropWithV1Familiars()', () => {
    it(`Should be successful if not yet minted`, async () => {
      // Airdrop these familiars
      await familiarV2.airdropWithV1Familiars(v1_ids)

      v1_ids.forEach(async (id, idx) => {
        const owner = await familiarV2.ownerOf(id)
        expect(owner).to.be.eql(v1_owners[idx])
      })
    })

    it(`Should throw if familiar is already minted`, async () => {
      // Mint these familiar once
      await familiarV2.airdropWithV1Familiars(v1_ids)
      
      // Try to mint these familiar again
      const tx = familiarV2.airdropWithV1Familiars(v1_ids)
      await expect(tx).to.be.rejectedWith(RevertError('Familiar has already been minted'))
    
      v1_ids.forEach(async (id) => {
        const tx = familiarV2.airdropWithV1Familiars([id])
        await expect(tx).to.be.rejectedWith(RevertError('Familiar has already been minted'))
      })
    })

    it(`Should throw if familiar does not exist on V1`, async () => {
      // Try to mint these familiar again
      const tx = familiarV2.airdropWithV1Familiars(UNMINTED_IDS)
      await expect(tx).to.be.rejectedWith(RevertError("ERC721: owner query for nonexistent token"))
    
      UNMINTED_IDS.forEach(async (id) => {
        const tx = familiarV2.airdropWithV1Familiars([id])
        await expect(tx).to.be.rejectedWith(RevertError("ERC721: owner query for nonexistent token"))
      })
    })
  })
})

import * as ethers from 'ethers'
import { expect, RevertError} from './utils'

import { LootFamiliars, LootFamiliarsV1, FlootClaim, ERC20TokenMock } from 'src/gen/typechain'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

// Importing contract artifacts
const FamiliarsV1Artifact = artifacts.require('LootFamiliarsV1')
const FamiliarsArtifact = artifacts.require('LootFamiliars')
const FlootClaimArtifact = artifacts.require('FlootClaim')
const ERC20TokenMockArtifact = artifacts.require('ERC20TokenMock')

// Constants to use
const v1_ids = [1, 2, 3, 4, 5]
const v2_from_v1_ids = [3, 4, 5] // V2 minted from V1
const v2_mint_ids = [6, 7, 8]    // V2 minted by paying ETH
const allowed_v1s = [3]          // V2s minted from V1 in time
const excluded_v1s = [4,5]       // V2s minted from V1 too late
const MINT_COST = ethers.utils.parseUnits("0.2", "ether")
const FLOOT_TOTAL_SUPPLY = 87738637 // Total supply of $FLOOT (10% reserve, 2% team, 88% owners)
const FLOOT_TO_LOCK = 77210000      // 88% of total FLOOT supply

contract('FlootClaim', () => {
  let familiarV1: LootFamiliarsV1
  let familiarV2: LootFamiliars
  let flootClaim: FlootClaim
  let floot: ERC20TokenMock
  let ownerAddress: string
  let owners_v1: string[]
  let owners_v2: string[]

  beforeEach(async () => {
    // Deploy contract
    familiarV1 = await FamiliarsV1Artifact.new()
    familiarV2 = await FamiliarsArtifact.new(familiarV1.address)
    floot = await ERC20TokenMockArtifact.new()
    flootClaim = await FlootClaimArtifact.new(familiarV1.address, familiarV2.address, floot.address)
    ownerAddress = await familiarV1.owner()
    owners_v1 = Array(5).fill(ownerAddress)
    owners_v2 = Array(6).fill(ownerAddress)

    // Mint all familiars V1 to owners
    await familiarV1.testMint(v1_ids, owners_v1)

    // Mint the V2s from V1s
    await familiarV2.airdropWithV1Familiars(v2_from_v1_ids)

    // Mint the V2s with ETH
    await familiarV2.multiMint(v2_mint_ids, {value: MINT_COST.mul(v2_from_v1_ids.length)})

    // Mint floot and send to floot claim contract
    await floot.mockMint(ownerAddress, ethers.BigNumber.from(FLOOT_TOTAL_SUPPLY).mul(ethers.BigNumber.from(10).pow(18)))
    await floot.transfer(flootClaim.address,  ethers.BigNumber.from(FLOOT_TO_LOCK).mul(ethers.BigNumber.from(10).pow(18)))

    // Enable some V1 familiars to claim FLOOT
    await flootClaim.enableV1Claim(allowed_v1s)
  })

  describe.only('flootClaim.isClaimable()', () => {
    it(`should return true if familiar has not been claimed yet`, async () => {
      v2_mint_ids.forEach(async (id) => {
        const isClaimable = await flootClaim.isClaimable(id)
        expect(isClaimable).to.be.true
      })
    })

    it(`should return true if V1 familiar has not been claimed yet and is eligible`, async () => {
      allowed_v1s.forEach(async (id) => {
        const isClaimable = await flootClaim.isClaimable(id)
        expect(isClaimable).to.be.true
      })
    })

    it(`should return false if familiar has been claimed`, async () => {
      // V1 already claimed
      await flootClaim.multiClaim(allowed_v1s)
      allowed_v1s.forEach(async (id) => {
        const isClaimable = await flootClaim.isClaimable(id)
        expect(isClaimable).to.be.false
      })

      //V2 already claimed
      await flootClaim.multiClaim(v2_mint_ids)
      v2_mint_ids.forEach(async (id) => {
        const isClaimable = await flootClaim.isClaimable(id)
        expect(isClaimable).to.be.false
      })
    })

    it(`should return false if familiar is from excluded V1`, async () => {
      excluded_v1s.forEach(async (id) => {
        const isClaimable = await flootClaim.isClaimable(id)
        expect(isClaimable).to.be.false
      })
    })
  })

  // describe('familiarV2.mint()', () => {
  //   it(`Should throw if not mint ID is out of range`, async () => {
  //     const tx = familiarV2.mint(8001, {value: MINT_COST})
  //     await expect(tx).to.be.rejectedWith(RevertError('Token ID invalid'))
  //   })

  //   it(`Should throw if not enough funds are sent`, async () => {
  //     UNMINTED_IDS.forEach(async (id) => {
  //       const tx = familiarV2.mint(id, {value: MINT_COST.sub(1)})
  //       await expect(tx).to.be.rejectedWith(RevertError('Ether amount sent is insufficient'))
  //     })
  //   })

  //   it(`Should throw if familiar is already minted`, async () => {
  //     UNMINTED_IDS.forEach(async (id) => {
  //       await familiarV2.mint(id, {value: MINT_COST})
  //     })
  //     UNMINTED_IDS.forEach(async (id) => {
  //       const tx = familiarV2.mint(id, {value: MINT_COST})
  //       await expect(tx).to.be.rejectedWith(RevertError('Familiar has already been minted'))
  //     })
  //   })

  //   it(`Should throw if familiar is reserved for V1`, async () => {
  //     v1_ids.forEach(async (id) => {
  //       const tx = familiarV2.mint(id, {value: MINT_COST})
  //       await expect(tx).to.be.rejectedWith(RevertError('Familiar is reserved for V1 familiar owner'))
  //     })
  //   })

  //   it(`Should be successful otherwise`, async () => {
  //     UNMINTED_IDS.forEach(async (id) => {
  //       const tx = familiarV2.mint(id, {value: MINT_COST})
  //       await expect(tx).to.be.fulfilled

  //       const owner = await familiarV2.ownerOf(id)
  //       expect(owner).to.be.eql(await familiarV2.owner())
  //     })
  //   })
  // })

  // describe('familiarV2.multiMint()', () => {
  //   it(`Should throw if not mint ID is out of range`, async () => {
  //     const tx = familiarV2.multiMint([8001], {value: MINT_COST})
  //     await expect(tx).to.be.rejectedWith(RevertError('Token ID invalid'))
  //   })

  //   it(`Should throw if not enough funds are sent`, async () => {
  //     const tx = familiarV2.multiMint(UNMINTED_IDS, {value: MINT_COST.mul(UNMINTED_IDS.length).sub(1)})
  //     await expect(tx).to.be.rejectedWith(RevertError('Ether amount sent is insufficient'))
      
  //     UNMINTED_IDS.forEach(async (id) => {
  //       const tx = familiarV2.multiMint([id], {value: MINT_COST.sub(1)})
  //       await expect(tx).to.be.rejectedWith(RevertError('Ether amount sent is insufficient'))
  //     })
  //   })

  //   it(`Should throw if familiar is already minted`, async () => {
  //     // Mint these familiar once
  //     await familiarV2.multiMint(UNMINTED_IDS, {value: MINT_COST.mul(UNMINTED_IDS.length)})
      
  //     // Try to mint these familiar again
  //     const tx = familiarV2.multiMint(UNMINTED_IDS, {value: MINT_COST.mul(UNMINTED_IDS.length)})
  //     await expect(tx).to.be.rejectedWith(RevertError('Familiar has already been minted'))
    
  //     UNMINTED_IDS.forEach(async (id) => {
  //       const tx = familiarV2.multiMint([id], {value: MINT_COST})
  //       await expect(tx).to.be.rejectedWith(RevertError('Familiar has already been minted'))
  //     })
  //   })

  //   it(`Should throw if familiar is reserved for V1`, async () => {
  //     // Try to mint these familiar again
  //     const tx = familiarV2.multiMint(v1_ids, {value: MINT_COST.mul(v1_ids.length)})
  //     await expect(tx).to.be.rejectedWith(RevertError('Familiar is reserved for V1 familiar owner'))
      
  //     v1_ids.forEach(async (id) => {
  //       const tx = familiarV2.multiMint([id], {value: MINT_COST})
  //       await expect(tx).to.be.rejectedWith(RevertError('Familiar is reserved for V1 familiar owner'))
  //     })
  //   })

  //   it(`Should be successful otherwise`, async () => {
  //     const tx = familiarV2.multiMint(UNMINTED_IDS, {value: MINT_COST.mul(UNMINTED_IDS.length)})
  //     await expect(tx).to.be.fulfilled

  //     UNMINTED_IDS.forEach(async (id) => {
  //       const owner = await familiarV2.ownerOf(id)
  //       expect(owner).to.be.eql(await familiarV2.owner())
  //     })
  //   })
  // })

  // describe('familiarV2.airdropWithV1Familiars()', () => {
  //   it(`Should be successful if not yet minted`, async () => {
  //     // Airdrop these familiars
  //     await familiarV2.airdropWithV1Familiars(v1_ids)

  //     v1_ids.forEach(async (id, idx) => {
  //       const owner = await familiarV2.ownerOf(id)
  //       expect(owner).to.be.eql(v1_owners[idx])
  //     })
  //   })

  //   it(`Should throw if familiar is already minted`, async () => {
  //     // Mint these familiar once
  //     await familiarV2.airdropWithV1Familiars(v1_ids)
      
  //     // Try to mint these familiar again
  //     const tx = familiarV2.airdropWithV1Familiars(v1_ids)
  //     await expect(tx).to.be.rejectedWith(RevertError('Familiar has already been minted'))
    
  //     v1_ids.forEach(async (id) => {
  //       const tx = familiarV2.airdropWithV1Familiars([id])
  //       await expect(tx).to.be.rejectedWith(RevertError('Familiar has already been minted'))
  //     })
  //   })

  //   it(`Should throw if familiar does not exist on V1`, async () => {
  //     // Try to mint these familiar again
  //     const tx = familiarV2.airdropWithV1Familiars(UNMINTED_IDS)
  //     await expect(tx).to.be.rejectedWith(RevertError("ERC721: owner query for nonexistent token"))
    
  //     UNMINTED_IDS.forEach(async (id) => {
  //       const tx = familiarV2.airdropWithV1Familiars([id])
  //       await expect(tx).to.be.rejectedWith(RevertError("ERC721: owner query for nonexistent token"))
  //     })
  //   })
  // })
})

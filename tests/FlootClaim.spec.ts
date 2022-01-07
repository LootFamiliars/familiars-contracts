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
  let flootPerFamiliar: ethers.BigNumber

  beforeEach(async () => {
    // Deploy contract
    familiarV1 = await FamiliarsV1Artifact.new()
    familiarV2 = await FamiliarsArtifact.new(familiarV1.address)
    floot = await ERC20TokenMockArtifact.new()
    flootClaim = await FlootClaimArtifact.new(familiarV1.address, familiarV2.address, floot.address)
    ownerAddress = await familiarV1.owner()
    owners_v1 = Array(5).fill(ownerAddress)
    flootPerFamiliar = ethers.BigNumber.from(10000).mul(ethers.BigNumber.from(10).pow(18))

    // Mint all familiars V1 to owners
    await familiarV1.testMint(v1_ids, owners_v1)

    // Mint the V2s from V1s
    await familiarV2.airdropWithV1Familiars(v2_from_v1_ids)

    // Mint the V2s with ETH
    await familiarV2.multiMint(v2_mint_ids, {value: MINT_COST.mul(v2_mint_ids.length)})

    // Mint floot and send to floot claim contract
    await floot.mockMint(ownerAddress, ethers.BigNumber.from(FLOOT_TOTAL_SUPPLY).mul(ethers.BigNumber.from(10).pow(18)))
    await floot.transfer(flootClaim.address,  ethers.BigNumber.from(FLOOT_TO_LOCK).mul(ethers.BigNumber.from(10).pow(18)))

    // Enable some V1 familiars to claim FLOOT
    await flootClaim.enableV1Claim(allowed_v1s)
  })

  describe('flootClaim.isClaimable()', () => {
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

  describe('flootClaim.isAllowed()', () => {
    it(`should return true if familiar is V2 only`, async () => {
      v2_mint_ids.forEach(async (id) => {
        const isAllowed = await flootClaim.isAllowed(id)
        expect(isAllowed).to.be.true
      })
    })

    it(`should return true if V1 familiar is eligible`, async () => {
      allowed_v1s.forEach(async (id) => {
        const isAllowed = await flootClaim.isAllowed(id)
        expect(isAllowed).to.be.true
      })
    })

    it(`should return false if familiar is from excluded V1`, async () => {
      excluded_v1s.forEach(async (id) => {
        const isAllowed = await flootClaim.isAllowed(id)
        expect(isAllowed).to.be.false
      })
    })
  })

  describe('flootClaim.multiClaim()', () => {
    it(`Should throw if not mint ID is out of range`, async () => {
      const tx = flootClaim.multiClaim([0,8001])
      await expect(tx).to.be.rejectedWith(RevertError('Familiar cannot claim FLOOT'))
    })

    it(`Should throw if familiar is already minted`, async () => {
      await flootClaim.multiClaim(v2_mint_ids)
      const tx = flootClaim.multiClaim(v2_mint_ids)
      await expect(tx).to.be.rejectedWith(RevertError("Familiar cannot claim FLOOT"))
    })

    it(`Should throw if familiar is from excluded V1`, async () => {
      const tx = flootClaim.multiClaim(excluded_v1s)
      await expect(tx).to.be.rejectedWith(RevertError('Familiar cannot claim FLOOT'))
    })

    it(`Should be successful otherwise`, async () => {
      const pre_balance = await floot.balanceOf(ownerAddress)
      const tx = flootClaim.multiClaim(allowed_v1s)
      await expect(tx).to.be.fulfilled

      const balance = await floot.balanceOf(ownerAddress)
      expect(balance.toString()).to.be.eql(flootPerFamiliar.mul(allowed_v1s.length).add(pre_balance.toString()).toString())

      const pre_balance2 = await floot.balanceOf(ownerAddress)
      const tx2 = flootClaim.multiClaim(v2_mint_ids)
      await expect(tx2).to.be.fulfilled

      const balance2 = await floot.balanceOf(ownerAddress)
      expect(balance2.toString()).to.be.eql((flootPerFamiliar.mul(v2_mint_ids.length).add(pre_balance2.toString()).toString()))
    })
  })

  describe('flootClaim.claim()', () => {
    it(`Should throw if not mint ID is out of range`, async () => {
      const tx = flootClaim.claim(8001)
      await expect(tx).to.be.rejectedWith(RevertError('Familiar cannot claim FLOOT'))
    })

    it(`Should throw if familiar is already minted`, async () => {
      v2_mint_ids.forEach(async (id) => {
        await flootClaim.claim(id)
      })
      v2_mint_ids.forEach(async (id) => {
        const tx = flootClaim.claim(id)
        await expect(tx).to.be.rejectedWith(RevertError("Familiar cannot claim FLOOT"))
      })
    })

    it(`Should throw if familiar is from excluded V1`, async () => {
      excluded_v1s.forEach(async (id) => {
        const tx = flootClaim.claim(id)
        await expect(tx).to.be.rejectedWith(RevertError('Familiar cannot claim FLOOT'))
      })
    })

    it(`Should be successful otherwise`, async () => {
      v2_from_v1_ids.forEach(async (id) => {
        const pre_balance = await floot.balanceOf(ownerAddress)
        const tx = flootClaim.claim(id)
        await expect(tx).to.be.fulfilled

        const balance = await floot.balanceOf(ownerAddress)
        expect(balance).to.be.eql(pre_balance.add(flootPerFamiliar))
      })

      v2_mint_ids.forEach(async (id) => {
        const pre_balance = await floot.balanceOf(ownerAddress)
        const tx = flootClaim.claim(id)
        await expect(tx).to.be.fulfilled

        const balance = await floot.balanceOf(ownerAddress)
        expect(balance).to.be.eql(pre_balance.add(flootPerFamiliar))
      })
    })
  })
})

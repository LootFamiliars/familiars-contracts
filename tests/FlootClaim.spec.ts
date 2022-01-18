import { ethers } from 'hardhat'
import { createTestWallet, expect, RevertError} from './utils'
import { web3 } from 'hardhat'
import { LootFamiliars, LootFamiliarsV1, FlootClaim, ERC20TokenMock } from 'src/gen/typechain'
import { BigNumber, ContractFactory } from 'ethers'

// Wallet
const { wallet: userWallet, provider: userProvider, signer: userSigner } = createTestWallet(web3, 2)

// Constants to use
const v1_ids = [1, 2, 3, 4, 5]
const v2_from_v1_ids = [3, 4, 5] // V2 minted from V1
const v2_mint_ids = [6, 7, 8]    // V2 minted by paying ETH
const allowed_v1s = [3]          // V2s minted from V1 in time
const excluded_v1s = [4,5]       // V2s minted from V1 too late
const non_minted_ids = [666, 77] // V2 ids that don't exist yet 
const MINT_COST = ethers.utils.parseUnits("0.2", "ether")
const FLOOT_TOTAL_SUPPLY = 87738637 // Total supply of $FLOOT (10% reserve, 2% team, 88% owners)
const FLOOT_TO_LOCK = 77210000      // 88% of total FLOOT supply

contract('FlootClaim', () => {
  let familiarV1: LootFamiliarsV1
  let familiarV2: LootFamiliars
  let familiarV2User: LootFamiliars
  let flootClaim: FlootClaim
  let flootClaimUser: FlootClaim
  let floot: ERC20TokenMock
  let ownerAddress: string
  let userAddress: string
  let users_v1: string[]
  let flootPerFamiliar: BigNumber

  // Importing contract artifacts
  let FamiliarsV1Artifact: ContractFactory
  let FamiliarsArtifact: ContractFactory
  let FlootClaimArtifact: ContractFactory
  let ERC20TokenMockArtifact: ContractFactory

  beforeEach(async () => {
    // Importing contract artifacts
    FamiliarsV1Artifact = await ethers.getContractFactory('LootFamiliarsV1')
    FamiliarsArtifact = await ethers.getContractFactory('LootFamiliars')
    FlootClaimArtifact = await ethers.getContractFactory('FlootClaim')
    ERC20TokenMockArtifact = await ethers.getContractFactory('ERC20TokenMock')

    // Deploy contract
    familiarV1 = await FamiliarsV1Artifact.deploy() as LootFamiliarsV1
    familiarV2 = await FamiliarsArtifact.deploy(familiarV1.address) as LootFamiliars
    familiarV2User = familiarV2.connect(userSigner) as LootFamiliars
    floot = await ERC20TokenMockArtifact.deploy() as ERC20TokenMock
    flootClaim = await FlootClaimArtifact.deploy(familiarV1.address, familiarV2.address, floot.address) as FlootClaim
    flootClaimUser = flootClaim.connect(userSigner) as FlootClaim
    ownerAddress = await familiarV1.owner()
    userAddress = await userWallet.getAddress()
    users_v1 = Array(5).fill(userAddress)
    flootPerFamiliar = ethers.BigNumber.from(10000).mul(ethers.BigNumber.from(10).pow(18))

    // Mint all familiars V1 to owners
    await familiarV1.testMint(v1_ids, users_v1)

    // Mint the V2s from V1s
    await familiarV2.airdropWithV1Familiars(v2_from_v1_ids)

    // Mint the V2s with ETH
    await familiarV2User.multiMint(v2_mint_ids, {value: MINT_COST.mul(v2_mint_ids.length)})

    // Mint floot and send to floot claim contract
    await floot.mockMint(ownerAddress, ethers.BigNumber.from(FLOOT_TOTAL_SUPPLY).mul(ethers.BigNumber.from(10).pow(18)))
    await floot.transfer(flootClaim.address,  ethers.BigNumber.from(FLOOT_TO_LOCK).mul(ethers.BigNumber.from(10).pow(18)))

    // Enable some V1 familiars to claim FLOOT
    await flootClaim.enableV1Claim(allowed_v1s)
  })

  describe('flootClaim.enableV1Claim()', () => {
    const ids = [666, 667, 668, 669]
    it(`should REVERT if not called by owner`, async () => {
      const tx = flootClaimUser.enableV1Claim(ids)
      await expect(tx).to.be.rejectedWith(RevertError('Ownable: caller is not the owner'))
    })

    it(`should PASS if called by owner`, async () => {
      const tx = flootClaim.enableV1Claim(ids)
      await expect(tx).to.be.fulfilled
    })

    it(`should set IDs as allowed`, async () => {
      await flootClaim.enableV1Claim(ids)
      ids.forEach(async (id) => {
        const isAllowed = await flootClaimUser.allowedV1(id)
        expect(isAllowed).to.be.true
      })
    })
  })

  describe('flootClaim.disableV1Claim()', () => {
    const ids = [666, 667, 668, 669]
    beforeEach(async () => {
      await flootClaim.enableV1Claim(ids) 
    })

    it(`should REVERT if not called by owner`, async () => {
      const tx = flootClaimUser.disableV1Claim(ids)
      await expect(tx).to.be.rejectedWith(RevertError('Ownable: caller is not the owner'))
    })

    it(`should PASS if called by owner`, async () => {
      const tx = flootClaim.disableV1Claim(ids)
      await expect(tx).to.be.fulfilled
    })

    it(`should set IDs as allowed`, async () => {
      await flootClaim.disableV1Claim(ids)
      ids.forEach(async (id) => {
        const isAllowed = await flootClaimUser.allowedV1(id)
        expect(isAllowed).to.be.false
      })
    })
  })

  describe('flootClaim.isClaimable()', () => {
    it(`should return true if familiar has not been claimed yet`, async () => {
      v2_mint_ids.forEach(async (id) => {
        const isClaimable = await flootClaimUser.isClaimable(id)
        expect(isClaimable).to.be.true
      })
    })

    it(`should return true if V1 familiar has not been claimed yet and is eligible`, async () => {
      allowed_v1s.forEach(async (id) => {
        const isClaimable = await flootClaimUser.isClaimable(id)
        expect(isClaimable).to.be.true
      })
    })

    it(`should return false if familiar has been claimed`, async () => {
      // V1 already claimed
      await flootClaimUser.multiClaim(allowed_v1s)
      allowed_v1s.forEach(async (id) => {
        const isClaimable = await flootClaimUser.isClaimable(id)
        expect(isClaimable).to.be.false
      })

      //V2 already claimed
      await flootClaimUser.multiClaim(v2_mint_ids)
      v2_mint_ids.forEach(async (id) => {
        const isClaimable = await flootClaimUser.isClaimable(id)
        expect(isClaimable).to.be.false
      })
    })

    it(`should return false if familiar is from excluded V1`, async () => {
      excluded_v1s.forEach(async (id) => {
        const isClaimable = await flootClaimUser.isClaimable(id)
        expect(isClaimable).to.be.false
      })
    })
  })

  describe('flootClaim.isAllowed()', () => {
    it(`should return true if familiar is V2 only`, async () => {
      v2_mint_ids.forEach(async (id) => {
        const isAllowed = await flootClaimUser.isAllowed(id)
        expect(isAllowed).to.be.true
      })
    })

    it(`should return true if V1 familiar is eligible`, async () => {
      allowed_v1s.forEach(async (id) => {
        const isAllowed = await flootClaimUser.isAllowed(id)
        expect(isAllowed).to.be.true
      })
    })

    it(`should return false if familiar is from excluded V1`, async () => {
      excluded_v1s.forEach(async (id) => {
        const isAllowed = await flootClaimUser.isAllowed(id)
        expect(isAllowed).to.be.false
      })
    })
  })

  describe('flootClaim.withdrawFloot()', () => {
    const year = 60 * 60 * 24 * 365 + 1
    it(`Should throw if claim time is not passed`, async () => {
      const tx = flootClaim.withdrawFloot()
      await expect(tx).to.be.rejectedWith(RevertError("Cannot withdraw FLOOT yet"))
    })

    describe('when claim time is passed', () => {
      let snap
      // Move time forward past claim date
      beforeEach(async () => {
        snap = await ethers.provider.send('evm_snapshot', []);
        await ethers.provider.send("evm_increaseTime", [year]);
      })

      // Bring back time to what it was
      afterEach(async () => {
        console.log(snap)
        await ethers.provider.send("evm_revert", [snap]);
      })

      it(`Should pass if called by owner`, async () => {
        const tx = flootClaim.withdrawFloot()
        await expect(tx).to.be.fulfilled
      })

      it(`Should REVERT if called by user`, async () => {
        const tx = flootClaimUser.withdrawFloot()
        await expect(tx).to.be.rejectedWith(RevertError('Ownable: caller is not the owner'))
      })

      it(`Should withdraw available floot`, async () => {
        const pre_balance_owner  = await floot.balanceOf(ownerAddress)
        const pre_balance_claim = await  floot.balanceOf(flootClaim.address)
        await flootClaim.withdrawFloot()
        const post_balance_owner  = await floot.balanceOf(ownerAddress)
        const post_balance_claim = await  floot.balanceOf(flootClaim.address)
        expect(post_balance_claim).to.be.eql(ethers.BigNumber.from(0))
        expect(post_balance_owner).to.be.eql(pre_balance_owner.add(pre_balance_claim)) 
      })
    })
  })

  describe('flootClaim.multiClaim()', () => {
    it(`Should throw if not mint ID is out of range`, async () => {
      const tx = flootClaimUser.multiClaim([0,8001])
      await expect(tx).to.be.rejectedWith(RevertError('Familiar cannot claim FLOOT'))
    })

    it(`Should throw if familiar does not exist but is eligible`, async () => {
      const tx = flootClaimUser.multiClaim(non_minted_ids)
      await expect(tx).to.be.rejectedWith(RevertError('ERC721: owner query for nonexistent token'))
    })

    it(`Should throw if familiar is already minted`, async () => {
      await flootClaimUser.multiClaim(v2_mint_ids)
      const tx = flootClaimUser.multiClaim(v2_mint_ids)
      await expect(tx).to.be.rejectedWith(RevertError("Familiar cannot claim FLOOT"))
    })

    it(`Should throw if familiar is from excluded V1`, async () => {
      const tx = flootClaimUser.multiClaim(excluded_v1s)
      await expect(tx).to.be.rejectedWith(RevertError('Familiar cannot claim FLOOT'))
    })

    it(`Should be successful if IDs are in-range and allowed`, async () => {
      const pre_balance = await floot.balanceOf(userAddress)
      const tx = flootClaimUser.multiClaim(allowed_v1s)
      await expect(tx).to.be.fulfilled

      const balance = await floot.balanceOf(userAddress)
      expect(balance.toString()).to.be.eql(flootPerFamiliar.mul(allowed_v1s.length).add(pre_balance.toString()).toString())

      const pre_balance2 = balance
      const tx2 = flootClaimUser.multiClaim(v2_mint_ids)
      await expect(tx2).to.be.fulfilled

      const balance2 = await floot.balanceOf(userAddress)
      expect(balance2.toString()).to.be.eql((flootPerFamiliar.mul(v2_mint_ids.length).add(pre_balance2.toString()).toString()))
    })
  })

  describe('flootClaim.claim()', () => {
    it(`Should throw if not mint ID is out of range`, async () => {
      const tx = flootClaimUser.claim(8001)
      await expect(tx).to.be.rejectedWith(RevertError('Familiar cannot claim FLOOT'))
    })

    it(`Should throw if familiar does not exist but is eligible`, async () => {
      const tx = flootClaimUser.claim(non_minted_ids[0])
      await expect(tx).to.be.rejectedWith(RevertError('ERC721: owner query for nonexistent token'))
    })

    it(`Should throw if familiar is already minted`, async () => {
      v2_mint_ids.forEach(async (id) => {
        await flootClaimUser.claim(id)
      })
      v2_mint_ids.forEach(async (id) => {
        const tx = flootClaimUser.claim(id)
        await expect(tx).to.be.rejectedWith(RevertError("Familiar cannot claim FLOOT"))
      })
    })

    it(`Should throw if familiar is from excluded V1`, async () => {
      excluded_v1s.forEach(async (id) => {
        const tx = flootClaimUser.claim(id)
        await expect(tx).to.be.rejectedWith(RevertError('Familiar cannot claim FLOOT'))
      })
    })

    it(`Should be successful otherwise`, async () => {
      v2_from_v1_ids.forEach(async (id) => {
        const pre_balance = await floot.balanceOf(userAddress)
        const tx = flootClaimUser.claim(id)
        await expect(tx).to.be.fulfilled

        const balance = await floot.balanceOf(userAddress)
        expect(balance).to.be.eql(pre_balance.add(flootPerFamiliar))
      })

      v2_mint_ids.forEach(async (id) => {
        const pre_balance = await floot.balanceOf(userAddress)
        const tx = flootClaimUser.claim(id)
        await expect(tx).to.be.fulfilled

        const balance = await floot.balanceOf(userAddress)
        expect(balance).to.be.eql(pre_balance.add(flootPerFamiliar))
      })
    })
  })

})

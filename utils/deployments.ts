import { ContractFactory } from 'ethers'
import { run, tenderly } from 'hardhat'

export const attempVerify = async <T extends ContractFactory>(name: string, _: new () => T, address: string, ...args: Parameters<T["deploy"]>) => {
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: args,
    })
  } catch {}

  try {
    await tenderly.verify({
      name: name,
      address: address,
    })
  } catch {}
}

export const buildNetworkJson = (...contracts: { name: string, address: string }[]) => {
  return contracts.map((c) => ({
    contractName: c.name,
    address: c.address
  }))
}

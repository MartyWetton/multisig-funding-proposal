const { ethers } = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()

  console.log('Deploying contracts with the account:', deployer.address)

  console.log('Account balance:', (await deployer.getBalance()).toString())

  const Proposal = await ethers.getContractFactory('MultisigFundingProposal')
  const proposal = await Proposal.deploy()

  console.log('Proposal address:', proposal.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

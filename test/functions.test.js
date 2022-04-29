const { ethers, waffle } = require('hardhat')
const { loadFixture } = waffle
const { expect } = require('chai')

const config = require('./test.config.json')
const { getSignerFromAddress } = require('./utils')

const ProposalState = {
  Pending: 0,
  Active: 1,
  Defeated: 2,
  Timelocked: 3,
  AwaitingExecution: 4,
  Executed: 5,
  Expired: 6,
}

describe('Multisig funding tests', () => {
  let minewait = async (time) => {
    await ethers.provider.send('evm_increaseTime', [time])
    await ethers.provider.send('evm_mine', [])
  }

  async function fixture() {
    // prepare addresses ------------------------------------------------------
    // ------------------------------------------------------------------------
    const [sender, deployer] = await ethers.getSigners()

    const tornWhale = await getSignerFromAddress(config.tornWhale)

    const tornToken = await ethers.getContractAt('ERC20', config.TORN)

    const gov = await ethers.getContractAt('GovernanceStakingUpgrade', config.governance)

    // deploy proposal --------------------------------------------------------
    // ------------------------------------------------------------------------
    const Proposal = await ethers.getContractFactory('MultisigFundingProposal')
    const proposal = await Proposal.connect(deployer).deploy()

    // prepare proposal on governance -----------------------------------------
    // ------------------------------------------------------------------------
    await tornToken.connect(tornWhale).approve(gov.address, ethers.utils.parseEther('1000000'))
    await gov.connect(tornWhale).lockWithApproval(ethers.utils.parseEther('26000'))

    let response = await gov.connect(tornWhale).propose(proposal.address, 'Multisig Funding Proposal')
    let proposalId = await gov.latestProposalIds(tornWhale.address)
    let state = await gov.state(proposalId)

    const { events } = await response.wait()
    const args = events.find(({ event }) => event == 'ProposalCreated').args
    expect(args.id).to.be.equal(proposalId)
    expect(args.proposer).to.be.equal(tornWhale.address)
    expect(args.target).to.be.equal(proposal.address)
    expect(args.description).to.be.equal('Multisig Funding Proposal')
    expect(state).to.be.equal(ProposalState.Pending)

    await minewait((await gov.VOTING_DELAY()).add(1).toNumber())
    await expect(gov.connect(tornWhale).castVote(proposalId, true)).to.not.be.reverted
    expect(await gov.state(proposalId)).to.be.equal(ProposalState.Active)

    await minewait(
      (
        await gov.VOTING_PERIOD()
      )
        .add(await gov.EXECUTION_DELAY())
        .add(96400)
        .toNumber(),
    )
    expect(await gov.state(proposalId)).to.be.equal(ProposalState.AwaitingExecution)

    return {
      sender,
      tornWhale,
      proposal,
      gov,
      tornToken,
      proposalId,
    }
  }

  it('Proposal should be executed correctly', async () => {
    const { gov, tornToken, proposalId, proposal } = await loadFixture(fixture)

    const multisigAddr = await proposal.MULTISIG()
    const sablierAddr = await proposal.SABLIER()
    const amount = await proposal.AMOUNT()
    const vestingAmount = await proposal.VESTING_AMOUNT()
    const period = await proposal.VESTING_PERIOD()
    const realVestingAmount = vestingAmount.div(period).mul(period)

    const multisigBalBefore = await tornToken.balanceOf(multisigAddr)
    const sablierBalBefore = await tornToken.balanceOf(sablierAddr)
    const govBalBefore = await tornToken.balanceOf(gov.address)

    await gov.execute(proposalId)

    expect(await gov.state(proposalId)).to.be.equal(ProposalState.Executed)

    expect(await tornToken.balanceOf(multisigAddr)).to.be.equal(multisigBalBefore.add(amount))
    expect(await tornToken.balanceOf(sablierAddr)).to.be.equal(sablierBalBefore.add(realVestingAmount))
    expect(await tornToken.balanceOf(gov.address)).to.be.equal(
      govBalBefore.sub(amount.add(realVestingAmount)),
    )
  })

  it('Multisig should take funds from Sablier', async () => {
    const { sender, gov, tornToken, proposalId, proposal } = await loadFixture(fixture)

    const sablierAddr = await proposal.SABLIER()
    const multisigAddr = await proposal.MULTISIG()
    const multisig = await getSignerFromAddress(multisigAddr)
    await sender.sendTransaction({ to: multisigAddr, value: ethers.utils.parseEther('1.0') })
    const sablier = await ethers.getContractAt('ISablier', sablierAddr)

    const response = await gov.execute(proposalId)

    const { events } = await response.wait()
    const streamId = events[5].data

    await minewait((await proposal.VESTING_PERIOD()).add(3601).toNumber())

    const vestingAmount = await proposal.VESTING_AMOUNT()
    const period = await proposal.VESTING_PERIOD()
    const realVestingAmount = vestingAmount.div(period).mul(period)

    const multisigBalBefore = await tornToken.balanceOf(multisigAddr)

    await sablier.connect(multisig).withdrawFromStream(streamId, realVestingAmount)

    expect(await tornToken.balanceOf(multisigAddr)).to.be.equal(multisigBalBefore.add(realVestingAmount))
  })
})

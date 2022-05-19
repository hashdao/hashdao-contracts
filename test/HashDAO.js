const { BigNumber } = require("ethers")
const chai = require("chai")
const { expect } = require("chai")

const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

chai.should()

// Defaults to e18 using amount * 10^18
function getBigNumber(amount, decimals = 18) {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(decimals))
}

async function advanceTime(time) {
  await ethers.provider.send("evm_increaseTime", [time])
}

describe("HashDAO", function () {
  let Hash // HashDAO contract
  let hash // HashDAO contract instance
  let proposer // signerA
  let alice // signerB
  let bob // signerC

  beforeEach(async () => {
    ;[proposer, alice, bob] = await ethers.getSigners()

    Hash = await ethers.getContractFactory("HashDAO")
    hash = await Hash.deploy()
    await hash.deployed()
    // console.log(hash.address)
    // console.log("alice eth balance", await alice.getBalance())
    // console.log("bob eth balance", await bob.getBalance())
  })

  it("Should initialize with correct params", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [proposer.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 0, 1]
    )
    expect(await hash.name()).to.equal("HASH")
    expect(await hash.symbol()).to.equal("HASH")
    expect(await hash.docs()).to.equal("DOCS")
    expect(await hash.paused()).to.equal(false)
    expect(await hash.balanceOf(proposer.address)).to.equal(getBigNumber(10))
    expect(await hash.votingPeriod()).to.equal(30)
    expect(await hash.gracePeriod()).to.equal(0)
    expect(await hash.quorum()).to.equal(0)
    expect(await hash.supermajority()).to.equal(60)
    expect(await hash.proposalVoteTypes(0)).to.equal(0)
    expect(await hash.proposalVoteTypes(1)).to.equal(0)
    expect(await hash.proposalVoteTypes(2)).to.equal(0)
    expect(await hash.proposalVoteTypes(3)).to.equal(0)
    expect(await hash.proposalVoteTypes(4)).to.equal(0)
    expect(await hash.proposalVoteTypes(5)).to.equal(0)
    expect(await hash.proposalVoteTypes(6)).to.equal(0)
    expect(await hash.proposalVoteTypes(7)).to.equal(1)
    expect(await hash.proposalVoteTypes(8)).to.equal(2)
    expect(await hash.proposalVoteTypes(9)).to.equal(3)
    expect(await hash.proposalVoteTypes(10)).to.equal(0)
    expect(await hash.proposalVoteTypes(11)).to.equal(1)
  })
  it("Should revert if initialization gov settings exceed bounds", async function () {
    expect(await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [proposer.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 0, 1, 1]
    ).should.be.reverted)
    expect(await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [proposer.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 0, 9]
    ).should.be.reverted)
  })
  it("Should revert if initialization arrays don't match", async function () {
    expect(await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [bob.address],
      [],
      [bob.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ).should.be.reverted)
    expect(await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [bob.address, alice.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ).should.be.reverted)
  })
  it("Should revert if already initialized", async function () {
    expect(await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [bob.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ))
    expect(await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [bob.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ).should.be.reverted)
  })
  it("Should revert if voting period is initialized null or longer than year", async function () {
    expect(await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [bob.address],
      [getBigNumber(10)],
      [0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ).should.be.reverted)
    expect(await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [bob.address],
      [getBigNumber(10)],
      [31536001, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ).should.be.reverted)
  })
  it("Should revert if grace period is initialized longer than year", async function () {
    expect(await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [bob.address],
      [getBigNumber(10)],
      [30, 31536001, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ).should.be.reverted)
  })
  it("Should revert if quorum is initialized greater than 100", async function () {
    expect(await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [bob.address],
      [getBigNumber(10)],
      [30, 0, 101, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ).should.be.reverted)
  })
  it("Should revert if supermajority is initialized less than 52 or greater than 100", async function () {
    expect(await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [bob.address],
      [getBigNumber(10)],
      [30, 0, 0, 51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ).should.be.reverted)
    expect(await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [bob.address],
      [getBigNumber(10)],
      [30, 0, 0, 101, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ).should.be.reverted)
  })
  it("Should revert if proposal arrays don't match", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [bob.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    expect(await hash.propose(
      0,
      "TEST",
      [bob.address, alice.address],
      [getBigNumber(1000)],
      [0x00]
    ).should.be.reverted)
  })
  it("Should revert if period proposal is for null or longer than year", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [bob.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    // normal
    await hash.propose(
      3,
      "TEST",
      [bob.address],
      [9000],
      [0x00]
    )
    expect(await hash.propose(
      3,
      "TEST",
      [bob.address],
      [0],
      [0x00]
    ).should.be.reverted)
    expect(await hash.propose(
      3,
      "TEST",
      [bob.address],
      [31536001],
      [0x00]
    ).should.be.reverted)
  })
  it("Should revert if grace proposal is for longer than year", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [bob.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    // normal
    await hash.propose(
      4,
      "TEST",
      [bob.address],
      [9000],
      [0x00]
    )
    expect(await hash.propose(
      4,
      "TEST",
      [bob.address],
      [31536001],
      [0x00]
    ).should.be.reverted)
  })
  it("Should revert if quorum proposal is for greater than 100", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [bob.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    // normal
    await hash.propose(
      5,
      "TEST",
      [bob.address],
      [20],
      [0x00]
    )
    expect(await hash.propose(
      5,
      "TEST",
      [bob.address],
      [101],
      [0x00]
    ).should.be.reverted)
  })
  it("Should revert if supermajority proposal is for less than 52 or greater than 100", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [bob.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    // normal
    await hash.propose(
      6,
      "TEST",
      [bob.address],
      [60],
      [0x00]
    )
    expect(await hash.propose(
      6,
      "TEST",
      [bob.address],
      [51],
      [0x00]
    ).should.be.reverted)
    expect(await hash.propose(
      6,
      "TEST",
      [bob.address],
      [101],
      [0x00]
    ).should.be.reverted)
  })
  it("Should revert if type proposal has proposal type greater than 10, vote type greater than 3, or setting length isn't 2", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [bob.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    // normal
    await hash.propose(
      7,
      "TEST",
      [bob.address, alice.address],
      [0, 1],
      [0x00, 0x00]
    )
    expect(await hash.propose(
      7,
      "TEST",
      [bob.address, alice.address],
      [12, 2],
      [0x00, 0x00]
    ).should.be.reverted)
    expect(await hash.propose(
      7,
      "TEST",
      [bob.address, alice.address],
      [0, 5],
      [0x00, 0x00]
    ).should.be.reverted)
    expect(await hash.propose(
      7,
      "TEST",
      [proposer.address, bob.address, alice.address],
      [0, 1, 0],
      [0x00, 0x00, 0x00]
    ).should.be.reverted)
  })
  it("Should allow proposer to cancel unsponsored proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.connect(alice).propose(
      0,
      "TEST",
      [alice.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.connect(alice).cancelProposal(1)
  })
  it("Should forbid non-proposer from cancelling unsponsored proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.connect(alice).propose(
      0,
      "TEST",
      [alice.address],
      [getBigNumber(1000)],
      [0x00]
    )
    expect(await hash.cancelProposal(0).should.be.reverted)
  })
  it("Should forbid proposer from cancelling sponsored proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.connect(alice).propose(
      0,
      "TEST",
      [alice.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.sponsorProposal(1)
    expect(await hash.connect(alice).cancelProposal(1).should.be.reverted)
  })
  it("Should forbid cancelling non-existent proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.connect(alice).propose(
      0,
      "TEST",
      [alice.address],
      [getBigNumber(1000)],
      [0x00]
    )
    expect(await hash.connect(alice).cancelProposal(10).should.be.reverted)
  })
  it("Should allow sponsoring proposal and processing", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.connect(alice).propose(
      0,
      "TEST",
      [alice.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.sponsorProposal(1)
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.balanceOf(alice.address)).to.equal(getBigNumber(1000))
  })
  it("Should forbid non-member from sponsoring proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.connect(alice).propose(
      0,
      "TEST",
      [alice.address],
      [getBigNumber(1000)],
      [0x00]
    )
    expect(await hash.connect(alice).sponsorProposal(0).should.be.reverted)
  })
  it("Should forbid sponsoring non-existent or processed proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.connect(alice).propose(
      0,
      "TEST",
      [alice.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.sponsorProposal(1)
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.balanceOf(alice.address)).to.equal(getBigNumber(1000))
    expect(await hash.sponsorProposal(1).should.be.reverted)
    expect(await hash.sponsorProposal(100).should.be.reverted)
  })
  it("Should forbid sponsoring an already sponsored proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.connect(alice).propose(
      0,
      "TEST",
      [alice.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.sponsorProposal(1)
    expect(await HASH.sponsorProposal(1).should.be.reverted)
  })
  it("Should allow self-sponsorship by a member", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(
      0,
      "TEST",
      [proposer.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.vote(1, true)
  })
  it("Should forbid a member from voting again on proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(
      0,
      "TEST",
      [proposer.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.vote(1, true)
    expect(await hash.vote(1, true).should.be.reverted)
  })
  it("Should forbid voting after period ends", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(
      0,
      "TEST",
      [proposer.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await advanceTime(35)
    expect(await hash.vote(1, true).should.be.reverted)
  })
  it("Should forbid processing before voting period ends", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(
      0,
      "TEST",
      [proposer.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.vote(1, true)
    await advanceTime(29)
    expect(await hash.processProposal(1).should.be.reverted)
  })
  it("Should forbid processing before grace period ends", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 30, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(
      0,
      "TEST",
      [proposer.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await advanceTime(29)
    await hash.vote(1, true)
    expect(await hash.processProposal(1).should.be.reverted)
  })
  it("Should process membership proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(
      0,
      "TEST",
      [proposer.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.balanceOf(proposer.address)).to.equal(getBigNumber(1001))
  })
  it("voteBySig should revert if the signature is invalid", async () => {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(0, "TEST", [alice.address], [0], [0x00])
    const rs = ethers.utils.formatBytes32String("rs")
    expect(
      hash.voteBySig(proposer.address, 0, true, 0, rs, rs).should.be.reverted
    )
  })
  it("Should process membership proposal via voteBySig", async () => {
    const domain = {
      name: "HASH",
      version: "1",
      chainId: 31337,
      verifyingContract: hash.address,
    }
    const types = {
      SignVote: [
        { name: "signer", type: "address" },
        { name: "proposal", type: "uint256" },
        { name: "approve", type: "bool" },
      ],
    }
    const value = {
      signer: proposer.address,
      proposal: 1,
      approve: true,
    }

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(0, "TEST", [alice.address], [getBigNumber(1000)], [0x00])

    const signature = await proposer._signTypedData(domain, types, value)
    const { r, s, v } = ethers.utils.splitSignature(signature)

    await hash.voteBySig(proposer.address, 1, true, v, r, s)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.balanceOf(alice.address)).to.equal(getBigNumber(1000))
  })
  it("Should process burn (eviction) proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(1, "TEST", [proposer.address], [getBigNumber(1)], [0x00])
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.balanceOf(proposer.address)).to.equal(0)
  })
  it("Should process contract call proposal - Single", async function () {
    let HashERC20 = await ethers.getContractFactory("HashERC20")
    let hashERC20 = await HashERC20.deploy()
    await hashERC20.deployed()
    await hashERC20.init(
      "HASH",
      "HASH",
      "DOCS",
      [hash.address],
      [getBigNumber(100)],
      false,
      hash.address
    )
    let payload = hashERC20.interface.encodeFunctionData("transfer", [
      alice.address,
      getBigNumber(15)
    ])
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(2, "TEST", [HASHERC20.address], [0], [payload])
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await HASHERC20.totalSupply()).to.equal(getBigNumber(100))
    expect(await HASHERC20.balanceOf(alice.address)).to.equal(getBigNumber(15))
  })
  it("Should process contract call proposal - Multiple", async function () {
    // Send Eth to HASH
    proposer.sendTransaction({
      to: hash.address,
      value: getBigNumber(10),
    })
    // Instantiate 1st contract
    let HashERC20 = await ethers.getContractFactory("HashERC20")
    let hashERC20 = await HashERC20.deploy()
    await hashERC20.deployed()
    await hashERC20.init(
      "HASH",
      "HASH",
      "DOCS",
      [hash.address],
      [getBigNumber(100)],
      false,
      hash.address
    )
    let payload = hashERC20.interface.encodeFunctionData("transfer", [
      alice.address,
      getBigNumber(15)
    ])
    // Instantiate 2nd contract
    let DropETH = await ethers.getContractFactory("DropETH")
    let dropETH = await DropETH.deploy()
    await dropETH.deployed()
    let payload2 = dropETH.interface.encodeFunctionData("dropETH", [
      [alice.address, bob.address],
      "hello",
    ])
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(
      2,
      "TEST",
      [hashERC20.address, dropETH.address],
      [0, getBigNumber(4)],
      [payload, payload2]
    )
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hashERC20.totalSupply()).to.equal(getBigNumber(100))
    expect(await hashERC20.balanceOf(alice.address)).to.equal(getBigNumber(15))
    expect(await dropETH.amount()).to.equal(getBigNumber(2))
    expect(await dropETH.recipients(1)).to.equal(bob.address)
  })
  it("Should process voting period proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    expect(await hash.votingPeriod()).to.equal(30)
    await hash.propose(3, "TEST", [proposer.address], [90], [0x00])
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.votingPeriod()).to.equal(90)
  })
  it("Should process grace period proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [90, 30, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    expect(await hash.gracePeriod()).to.equal(30)
    await hash.propose(4, "TEST", [proposer.address], [60], [0x00])
    await hash.vote(1, true)
    await advanceTime(125)
    await hash.processProposal(1)
    expect(await hash.gracePeriod()).to.equal(60)
  })
  it("Should process quorum proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(5, "TEST", [proposer.address], [100], [0x00])
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.quorum()).to.equal(100)
  })
  it("Should process supermajority proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(6, "TEST", [proposer.address], [52], [0x00])
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.supermajority()).to.equal(52)
  })
  it("Should process type proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(
      7,
      "TEST",
      [proposer.address, proposer.address],
      [0, 3],
      [0x00, 0x00]
    )
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.proposalVoteTypes(0)).to.equal(3)
  })
  it("Should process pause proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(8, "TEST", [proposer.address], [0], [0x00])
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.paused()).to.equal(false)
  })
  it("Should process extension proposal - General", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(9, "TEST", [wethAddress], [0], [0x00])
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.extensions(wethAddress)).to.equal(false)
  })
  it("Should toggle extension proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(9, "TEST", [wethAddress], [1], [0x00])
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.extensions(wethAddress)).to.equal(true)
  })
  it("Should process extension proposal - HashDAOcrowdsale with ETH", async function () {
    // Instantiate HASHDAO
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    // Instantiate HashWhitelistManager
    let HashWhitelistManager = await ethers.getContractFactory(
      "HashAccessManager"
    )
    let hashWhitelistManager = await HashWhitelistManager.deploy()
    await hashWhitelistManager.deployed()
    // Instantiate extension contract
    let HashDAOcrowdsale = await ethers.getContractFactory("HashDAOcrowdsale")
    let hashDAOcrowdsale = await HashDAOcrowdsale.deploy(
      hashWhitelistManager.address,
      wethAddress
    )
    await hashDAOcrowdsale.deployed()
    // Set up whitelist
    await hashWhitelistManager.createList(
      [alice.address],
      "0x074b43252ffb4a469154df5fb7fe4ecce30953ba8b7095fe1e006185f017ad10",
      "TEST_META"
    )
    // Set up payload for extension proposal
    let payload = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint8", "address", "uint32", "uint96", "uint96", "string"],
      [
        1,
        2,
        "0x0000000000000000000000000000000000000000",
        1672174799,
        getBigNumber(1000),
        getBigNumber(100),
        "DOCS"
      ]
    )
    await hash.propose(9, "TEST", [HashDAOcrowdsale.address], [1], [payload])
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    await HashDAOcrowdsale 
      .connect(alice)
      .callExtension(hash.address, getBigNumber(50), {
        value: getBigNumber(50),
      })
    expect(await ethers.provider.getBalance(hash.address)).to.equal(
      getBigNumber(50)
    )
    expect(await hash.balanceOf(alice.address)).to.equal(getBigNumber(100))
  })
  it("Should process extension proposal - HashDAOcrowdsale with ERC20", async function () {
    // Instantiate purchaseToken
    let PurchaseToken = await ethers.getContractFactory("HashERC20")
    let purchaseToken = await PurchaseToken.deploy()
    await purchaseToken.deployed()
    await purchaseToken.init(
      "HASH",
      "HASH",
      "DOCS",
      [alice.address],
      [getBigNumber(1000)],
      false,
      alice.address
    )
    await purchaseToken.deployed()
    // Instantiate HASHDAO
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    // Instantiate HashWhitelistManager
    let HashWhitelistManager = await ethers.getContractFactory(
      "HashAccessManager"
    )
    let hashWhitelistManager = await HashWhitelistManager.deploy()
    await hashWhitelistManager.deployed()
    // Instantiate extension contract
    let HashDAOcrowdsale = await ethers.getContractFactory("HashDAOcrowdsale")
    let hashDAOcrowdsale = await HashDAOcrowdsale.deploy(
      hashWhitelistManager.address,
      wethAddress
    )
    await hashDAOcrowdsale.deployed()
    // Set up whitelist
    await hashWhitelistManager.createList(
      [alice.address],
      "0x074b43252ffb4a469154df5fb7fe4ecce30953ba8b7095fe1e006185f017ad10",
      "TEST_META"
    )
    // Set up payload for extension proposal
    let payload = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "uint8", "address", "uint32", "uint96", "uint96", "string"],
      [
        1,
        2,
        purchaseToken.address,
        1672174799,
        getBigNumber(1000),
        getBigNumber(100),
        "DOCS"
      ]
    )
    await hash.propose(9, "TEST", [hashDAOcrowdsale.address], [1], [payload])
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    await purchaseToken
      .connect(alice)
      .approve(hashDAOcrowdsale.address, getBigNumber(50))
    await hashDAOcrowdsale
      .connect(alice)
      .callExtension(hash.address, getBigNumber(50))
    expect(await purchaseToken.balanceOf(hash.address)).to.equal(
      getBigNumber(50)
    )
    expect(await hash.balanceOf(alice.address)).to.equal(getBigNumber(100))
  })
  it("Should process escape proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(
      0,
      "TEST",
      [proposer.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.vote(1, true)
    await hash.propose(
      0,
      "TEST",
      [proposer.address],
      [getBigNumber(99)],
      [0x00]
    )
    await hash.vote(2, false)
    await hash.propose(10, "TEST", [proposer.address], [2], [0x00])
    await hash.vote(3, true)
    await advanceTime(35)
    await hash.processProposal(3)
    // Proposal #1 remains intact
    // console.log(await HASH.proposals(0))
    // Proposal #2 deleted
    // console.log(await HASH.proposals(1))
  })
  it("Should process docs proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(11, "TEST", [], [], [])
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.docs()).to.equal("TEST")
  })
  it("Should forbid processing a non-existent proposal", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    expect(await hash.processProposal(2).should.be.reverted)
  })
  it("Should forbid processing a proposal that was already processed", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(
      0,
      "TEST",
      [proposer.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.processProposal(1).should.be.reverted)
  })
  it("Should forbid processing a proposal before voting period ends", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.propose(
      0,
      "TEST",
      [proposer.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.vote(1, true)
    await advanceTime(20)
    expect(await hash.processProposal(1).should.be.reverted)
  })
  it("Should forbid processing a proposal before previous processes", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    // normal
    await hash.propose(
      0,
      "TEST",
      [proposer.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    // check case
    await hash.propose(
      0,
      "TEST",
      [proposer.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.vote(2, true)
    await hash.propose(
      0,
      "TEST",
      [proposer.address],
      [getBigNumber(1000)],
      [0x00]
    )
    await hash.vote(3, true)
    await advanceTime(35)
    expect(await hash.processProposal(3).should.be.reverted)
    await hash.processProposal(2)
    await hash.processProposal(3)
  })
  it("Should forbid calling a non-whitelisted extension", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    expect(await hash.callExtension(wethAddress, 10, 0x0).should.be.reverted)
  })
  it("Should forbid non-whitelisted extension calling DAO", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    expect(await hash.connect(alice).callExtension(bob.address, 10, 0x0).should.be.reverted)
  })
  it("Should allow a member to transfer shares", async function () {
    let sender, receiver
    ;[sender, receiver] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.transfer(receiver.address, getBigNumber(4))
    expect(await hash.balanceOf(sender.address)).to.equal(getBigNumber(6))
    expect(await hash.balanceOf(receiver.address)).to.equal(getBigNumber(4))
    // console.log(await hash.balanceOf(sender.address))
    // console.log(await hash.balanceOf(receiver.address))
  })
  it("Should not allow a member to transfer excess shares", async function () {
    let sender, receiver
    ;[sender, receiver] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    expect(
      await hash.transfer(receiver.address, getBigNumber(11)).should.be.reverted
    )
  })
  it("Should not allow a member to transfer shares if paused", async function () {
    let sender, receiver
    ;[sender, receiver] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    expect(
      await hash.transfer(receiver.address, getBigNumber(1)).should.be.reverted
    )
  })
  it("Should allow a member to burn shares", async function () {
    let sender, receiver
    ;[sender, receiver] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.burn(getBigNumber(1))
  })
  it("Should not allow a member to burn excess shares", async function () {
    let sender, receiver
    ;[sender, receiver] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    expect(
      await hash.burn(getBigNumber(11)).should.be.reverted
    )
  })
  it("Should allow a member to approve burn of shares (burnFrom)", async function () {
    let sender, receiver
    ;[sender, receiver] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.approve(receiver.address, getBigNumber(1))
    expect(await hash.allowance(sender.address, receiver.address)).to.equal(getBigNumber(1))
    await hash.connect(receiver).burnFrom(sender.address, getBigNumber(1))
  })
  it("Should not allow a member to approve excess burn of shares (burnFrom)", async function () {
    let sender, receiver
    ;[sender, receiver] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.approve(receiver.address, getBigNumber(1))
    expect(await hash.allowance(sender.address, receiver.address)).to.equal(getBigNumber(1))
    expect(await hash.connect(receiver).burnFrom(sender.address, getBigNumber(8)).should.be.reverted)
    expect(await hash.connect(receiver).burnFrom(sender.address, getBigNumber(11)).should.be.reverted)
  })
  it("Should allow a member to approve pull transfers", async function () {
    let sender, receiver
    ;[sender, receiver] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.approve(receiver.address, getBigNumber(4))
    expect(await hash.allowance(sender.address, receiver.address)).to.equal(getBigNumber(4))
  })
  it("Should allow an approved account to pull transfer (transferFrom)", async function () {
    let sender, receiver
    ;[sender, receiver] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.approve(receiver.address, getBigNumber(4))
    expect(await hash.allowance(sender.address, receiver.address)).to.equal(getBigNumber(4))
    await hash.connect(receiver).transferFrom(sender.address, receiver.address, getBigNumber(4))
  })
  it("Should not allow an account to pull transfer (transferFrom) beyond approval", async function () {
    let sender, receiver
    ;[sender, receiver] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.approve(receiver.address, getBigNumber(4))
    expect(await hash.allowance(sender.address, receiver.address)).to.equal(getBigNumber(4))
    expect(await hash.connect(receiver).transferFrom(sender.address, receiver.address, getBigNumber(5)).should.be.reverted)
  })
  it("Should not allow an approved account to pull transfer (transferFrom) if paused", async function () {
    let sender, receiver
    ;[sender, receiver] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.approve(receiver.address, getBigNumber(4))
    expect(await hash.allowance(sender.address, receiver.address)).to.equal(getBigNumber(4))
    expect(await hash.connect(receiver).transferFrom(sender.address, receiver.address, getBigNumber(4)).should.be.reverted)
  })
  it("Should not allow vote tally after current timestamp", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [bob.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    expect(
      await hash.getPriorVotes(bob.address, 1941275221).should.be.reverted
    )
  })
  it("Should list member as 'delegate' if no delegation to others", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [bob.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    expect(await hash.delegates(bob.address)).to.equal(bob.address)
  })
  it("Should match current votes to undelegated balance", async function () {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [bob.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    expect(await hash.getCurrentVotes(bob.address)).to.equal(getBigNumber(10))
  })
  it("Should allow vote delegation", async function () {
    let sender, receiver
    ;[sender, receiver] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.delegate(receiver.address)
    expect(await hash.delegates(sender.address)).to.equal(receiver.address)
    expect(await hash.getCurrentVotes(sender.address)).to.equal(0)
    expect(await hash.getCurrentVotes(receiver.address)).to.equal(getBigNumber(10))
    expect(await hash.balanceOf(sender.address)).to.equal(getBigNumber(10))
    expect(await hash.balanceOf(receiver.address)).to.equal(0)
    await hash.delegate(sender.address)
    expect(await hash.delegates(sender.address)).to.equal(sender.address)
    expect(await hash.getCurrentVotes(sender.address)).to.equal(getBigNumber(10))
    expect(await hash.getCurrentVotes(receiver.address)).to.equal(0)
  })
  it("Should update delegated balance after transfer", async function () {
    let sender, receiver, receiver2
    ;[sender, receiver, receiver2] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.delegate(receiver.address)
    expect(await hash.getCurrentVotes(sender.address)).to.equal(0)
    expect(await hash.getCurrentVotes(receiver.address)).to.equal(getBigNumber(10))
    await hash.transfer(receiver2.address, getBigNumber(5))
    expect(await hash.getCurrentVotes(receiver2.address)).to.equal(getBigNumber(5))
    expect(await hash.getCurrentVotes(sender.address)).to.equal(0)
    expect(await hash.getCurrentVotes(receiver.address)).to.equal(getBigNumber(5))
    await hash.delegate(sender.address)
    expect(await hash.getCurrentVotes(sender.address)).to.equal(getBigNumber(5))
  })
  it("Should update delegated balance after pull transfer (transferFrom)", async function () {
    let sender, receiver, receiver2
    ;[sender, receiver, receiver2] = await ethers.getSigners()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      false,
      [],
      [],
      [sender.address],
      [getBigNumber(10)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    await hash.delegate(receiver.address)
    expect(await hash.getCurrentVotes(sender.address)).to.equal(0)
    expect(await hash.getCurrentVotes(receiver.address)).to.equal(getBigNumber(10))
    await hash.approve(receiver.address, getBigNumber(5))
    await hash.connect(receiver).transferFrom(sender.address, receiver2.address, getBigNumber(5))
    expect(await hash.getCurrentVotes(receiver2.address)).to.equal(getBigNumber(5))
    expect(await hash.getCurrentVotes(sender.address)).to.equal(0)
    expect(await hash.getCurrentVotes(receiver.address)).to.equal(getBigNumber(5))
    await hash.delegate(sender.address)
    expect(await hash.getCurrentVotes(sender.address)).to.equal(getBigNumber(5))
  })
  it("Should allow permit if the signature is valid", async () => {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    const domain = {
      name: "HASH",
      version: "1",
      chainId: 31337,
      verifyingContract: hash.address,
    }
    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    }
    const value = {
      owner: proposer.address,
      spender: bob.address,
      value: getBigNumber(1),
      nonce: 0,
      deadline: 1941543121
    }

    const signature = await proposer._signTypedData(domain, types, value)
    const { r, s, v } = ethers.utils.splitSignature(signature)
    
    await hash.permit(proposer.address, bob.address, getBigNumber(1), 1941543121, v, r, s)

    // Unpause to unblock transferFrom
    await hash.propose(8, "TEST", [proposer.address], [0], [0x00])
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.paused()).to.equal(false)

    // console.log(
    //   "Proposer's balance before delegation: ",
    //   await hash.balanceOf(proposer.address)
    // )
    // console.log(
    //   "Bob's balance before delegation: ",
    //   await hash.balanceOf(bob.address)
    // )
    await hash.connect(bob).transferFrom(proposer.address, bob.address, getBigNumber(1))
    // console.log(
    //   "Proposer's balance after delegation: ",
    //   await hash.balanceOf(proposer.address)
    // )
    // console.log(
    //   "Bob's balance after delegation: ",
    //   await hash.balanceOf(bob.address)
    // )
    expect(await hash.balanceOf(bob.address)).to.equal(getBigNumber(1))
  })
  it("Should revert permit if the signature is invalid", async () => {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    const rs = ethers.utils.formatBytes32String("rs")
    expect(
      await hash.permit(proposer.address, bob.address, getBigNumber(1), 1941525801, 0, rs, rs).should.be.reverted
    )
  })
  it("Should allow delegateBySig if the signature is valid", async () => {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    const domain = {
      name: "HASH",
      version: "1",
      chainId: 31337,
      verifyingContract: hash.address,
    }
    const types = {
      Delegation: [
        { name: "delegatee", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "expiry", type: "uint256" },
      ],
    }
    const value = {
      delegatee: bob.address,
      nonce: 0,
      expiry: 1941543121
    }

    const signature = await proposer._signTypedData(domain, types, value)
    const { r, s, v } = ethers.utils.splitSignature(signature)

    hash.delegateBySig(bob.address, 0, 1941525801, v, r, s)
  })
  it("Should revert delegateBySig if the signature is invalid", async () => {
    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    const rs = ethers.utils.formatBytes32String("rs")
    expect(
      await hash.delegateBySig(bob.address, 0, 1941525801, 0, rs, rs).should.be.reverted
    )
  })
  it("Should revert reentrant calls", async () => {
    let ReentrantMock // ReentrantMock contract
    let reentrantMock // ReentrantMock contract instance

    Reentrant = await ethers.getContractFactory("ReentrantMock")
    reentrant = await Reentrant.deploy()
    await reentrant.deployed()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [],
      [],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )
    
    await hash.propose(9, "TEST", [reentrant.address], [1], [0x0])
    await hash.vote(1, true)
    await advanceTime(35)
    await hash.processProposal(1)
    expect(await hash.extensions(reentrant.address)).to.equal(true)
    
    expect(await hash.callExtension(reentrant.address, 0, "").should.be.reverted)
  })
  it("Should not call if null length payload", async () => {
    let CallMock // CallMock contract
    let callMock // CallMock contract instance

    CallMock = await ethers.getContractFactory("CallMock")
    callMock = await CallMock.deploy()
    await callMock.deployed()

    await hash.init(
      "HASH",
      "HASH",
      "DOCS",
      true,
      [callMock.address],
      [0x00],
      [proposer.address],
      [getBigNumber(1)],
      [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    )

    expect(await callMock.called()).to.equal(false)
  })
})
const { BigNumber } = require("ethers")
const chai = require("chai")
const { expect } = require("chai")

chai.should()

// Defaults to e18 using amount * 10^18
function getBigNumber(amount, decimals = 18) {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(decimals))
}

describe("Deployer", function () {
    let Hash // HashDAO contract
    let hash // HashDAO contract instance
    let alice // signerA
    let bob // signerB
    let carol // signerC
  
    beforeEach(async () => {
      ;[alice, bob, carol] = await ethers.getSigners()
  
      Hash = await ethers.getContractFactory("HashDAO")
      hash = await Hash.deploy()
      await hash.deployed()
    })
  
    it("Should deploy Hash DAO", async function () {
        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [alice.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )

        expect(await hash.balanceOf(alice.address)).to.equal(getBigNumber(10))
    })
  })

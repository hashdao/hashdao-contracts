const { BigNumber } = require("ethers")
const chai = require("chai")
const { expect } = require("chai")

chai.should()

// Defaults to e18 using amount * 10^18
function getBigNumber(amount, decimals = 18) {
  return BigNumber.from(amount).mul(BigNumber.from(10).pow(decimals))
}

async function advanceTime(time) {
  await ethers.provider.send("evm_increaseTime", [time])
}

describe("Tribute", function () {
    let Hash // HashDAO contract
    let hash // HashDAO contract instance
    let Tribute // Tribute contract
    let tribute // Tribute contract instance
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
      Tribute = await ethers.getContractFactory("HashDAOtribute")
      tribute = await Tribute.deploy()
      await tribute.deployed()
    })

    it("Should process tribute proposal directly", async function () {
        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        // Instantiate Tribute
        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            false,
            "0x0000000000000000000000000000000000000000",
            getBigNumber(50),
            { value: getBigNumber(50), }
        )

        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            getBigNumber(50)
        )
        expect(await ethers.provider.getBalance(hash.address)).to.equal(
            getBigNumber(0)
        )

        expect(await hash.balanceOf(proposer.address)).to.equal(
            getBigNumber(10)
        )

        await hash.sponsorProposal(1)
        await hash.vote(1, true)
        await advanceTime(35)
        await tribute.releaseTributeProposalAndProcess(hash.address, 1)
        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            getBigNumber(0)
        )
        expect(await ethers.provider.getBalance(hash.address)).to.equal(
            getBigNumber(50)
        )
        expect(await hash.balanceOf(proposer.address)).to.equal(
            getBigNumber(1010)
        )
    })
  
    it("Should process ETH tribute proposal", async function () {
        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        // Instantiate Tribute
        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            false,
            "0x0000000000000000000000000000000000000000",
            getBigNumber(50),
            { value: getBigNumber(50), }
        )

        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            getBigNumber(50)
        )
        expect(await ethers.provider.getBalance(hash.address)).to.equal(
            getBigNumber(0)
        )

        expect(await hash.balanceOf(proposer.address)).to.equal(
            getBigNumber(10)
        )

        await hash.sponsorProposal(1)
        await hash.vote(1, true)
        await advanceTime(35)
        await hash.processProposal(1)
        await tribute.releaseTributeProposal(hash.address, 1)
        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            getBigNumber(0)
        )
        expect(await ethers.provider.getBalance(hash.address)).to.equal(
            getBigNumber(50)
        )
        expect(await hash.balanceOf(proposer.address)).to.equal(
            getBigNumber(1010)
        )
    })

    it("Should process ERC20 tribute proposal", async function () {
        // Instantiate purchaseToken
        PurchaseToken = await ethers.getContractFactory("HashERC20")
        purchaseToken = await PurchaseToken.deploy()
        await purchaseToken.deployed()
        await purchaseToken.init(
            "Hash",
            "Hash",
            "DOCS",
            [proposer.address],
            [getBigNumber(1000)],
            false,
            proposer.address
        )

        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        
        await purchaseToken.approve(tribute.address, getBigNumber(50))

        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            false,
            purchaseToken.address,
            getBigNumber(50)
        )
        
        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            getBigNumber(950)
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            getBigNumber(50)
        )
        expect(await purchaseToken.balanceOf(hash.address)).to.equal(
            getBigNumber(0)
        )

        expect(await hash.balanceOf(proposer.address)).to.equal(
            getBigNumber(10)
        )

        await hash.sponsorProposal(1)
        await hash.vote(1, true)
        await advanceTime(35)
        await hash.processProposal(1)
        await tribute.releaseTributeProposal(hash.address, 1)
        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            getBigNumber(950)
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            getBigNumber(0)
        )
        expect(await purchaseToken.balanceOf(hash.address)).to.equal(
            getBigNumber(50)
        )
        expect(await hash.balanceOf(proposer.address)).to.equal(
            getBigNumber(1010)
        )
    })

    it("Should process NFT tribute proposal", async function () {
        // Instantiate purchaseToken
        let PurchaseToken = await ethers.getContractFactory("HashNFT")
        let purchaseToken = await PurchaseToken.deploy(
            "NFT",
            "NFT"
        )
        await purchaseToken.deployed()
        await purchaseToken.mint(proposer.address, 1, "DOCS")

        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        
        await purchaseToken.approve(tribute.address, 1)

        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            true,
            purchaseToken.address,
            1
        )

        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            0
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            1
        )
        expect(await purchaseToken.ownerOf(1)).to.equal(
            tribute.address
        )
        expect(await purchaseToken.balanceOf(hash.address)).to.equal(
            0
        )

        expect(await hash.balanceOf(proposer.address)).to.equal(
            getBigNumber(10)
        )

        await hash.sponsorProposal(1)
        await hash.vote(1, true)
        await advanceTime(35)
        await hash.processProposal(1)
        await tribute.releaseTributeProposal(hash.address, 1)
        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            0
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            0
        )
        expect(await purchaseToken.balanceOf(hash.address)).to.equal(
            1
        )
        expect(await purchaseToken.ownerOf(1)).to.equal(
            hash.address
        )
        expect(await hash.balanceOf(proposer.address)).to.equal(
            getBigNumber(1010)
        )
    })

    it("Should allow ETH tribute proposal cancellation", async function () {
        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        // Instantiate Tribute
        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            false,
            "0x0000000000000000000000000000000000000000",
            getBigNumber(50),
            { value: getBigNumber(50), }
        )

        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            getBigNumber(50)
        )

        await tribute.cancelTributeProposal(hash.address, 1)

        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            0
        )
        expect(await ethers.provider.getBalance(hash.address)).to.equal(
            0
        )

        expect(await hash.balanceOf(proposer.address)).to.equal(
            getBigNumber(10)
        )
    })

    it("Should allow ERC20 tribute proposal cancellation", async function () {
        // Instantiate purchaseToken
        PurchaseToken = await ethers.getContractFactory("HashERC20")
        purchaseToken = await PurchaseToken.deploy()
        await purchaseToken.deployed()
        await purchaseToken.init(
            "Hash",
            "Hash",
            "DOCS",
            [proposer.address],
            [getBigNumber(1000)],
            false,
            proposer.address
        )
        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        
        await purchaseToken.approve(tribute.address, getBigNumber(50))

        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            false,
            purchaseToken.address,
            getBigNumber(50)
        )
        
        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            getBigNumber(950)
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            getBigNumber(50)
        )
        expect(await purchaseToken.balanceOf(hash.address)).to.equal(
            getBigNumber(0)
        )

        expect(await hash.balanceOf(proposer.address)).to.equal(
            getBigNumber(10)
        )

        await tribute.cancelTributeProposal(hash.address, 1)

        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            getBigNumber(1000)
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            getBigNumber(0)
        )
        expect(await purchaseToken.balanceOf(hash.address)).to.equal(
            getBigNumber(0)
        )

        expect(await hash.balanceOf(proposer.address)).to.equal(
            getBigNumber(10)
        )
    })

    it("Should allow NFT tribute proposal cancellation", async function () {
        // Instantiate purchaseToken
        let PurchaseToken = await ethers.getContractFactory("HashNFT")
        let purchaseToken = await PurchaseToken.deploy(
            "NFT",
            "NFT"
        )
        await purchaseToken.deployed()
        await purchaseToken.mint(proposer.address, 1, "DOCS")

        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        
        await purchaseToken.approve(tribute.address, 1)

        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            true,
            purchaseToken.address,
            1
        )

        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            0
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            1
        )
        expect(await purchaseToken.ownerOf(1)).to.equal(
            tribute.address
        )
        expect(await purchaseToken.balanceOf(hash.address)).to.equal(
            0
        )

        expect(await hash.balanceOf(proposer.address)).to.equal(
            getBigNumber(10)
        )

        await tribute.cancelTributeProposal(hash.address, 1)

        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            1
        )
        expect(await purchaseToken.ownerOf(1)).to.equal(
            proposer.address
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            0
        )
        expect(await purchaseToken.balanceOf(hash.address)).to.equal(
            0
        )
   
        expect(await hash.balanceOf(proposer.address)).to.equal(
            getBigNumber(10)
        )
    })

    it("Should prevent cancellation by non-proposer of tribute proposal", async function () {
        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        // Instantiate Tribute
        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            false,
            "0x0000000000000000000000000000000000000000",
            getBigNumber(50),
            { value: getBigNumber(50), }
        )

        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            getBigNumber(50)
        )
        
        expect(await tribute.connect(alice).cancelTributeProposal(hash.address, 1).should.be.reverted)
    })

    it("Should prevent cancellation of sponsored ETH tribute proposal", async function () {
        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        // Instantiate Tribute
        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            false,
            "0x0000000000000000000000000000000000000000",
            getBigNumber(50),
            { value: getBigNumber(50), }
        )

        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            getBigNumber(50)
        )

        await hash.sponsorProposal(1)
        
        expect(await tribute.cancelTributeProposal(hash.address, 1).should.be.reverted)
    })

    it("Should prevent cancellation of sponsored ERC20 tribute proposal", async function () {
        // Instantiate purchaseToken
        PurchaseToken = await ethers.getContractFactory("HashERC20")
        purchaseToken = await PurchaseToken.deploy()
        await purchaseToken.deployed()
        await purchaseToken.init(
            "Hash",
            "Hash",
            "DOCS",
            [proposer.address],
            [getBigNumber(1000)],
            false,
            proposer.address
        )
        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        
        await purchaseToken.approve(tribute.address, getBigNumber(50))

        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            false,
            purchaseToken.address,
            getBigNumber(50)
        )
        
        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            getBigNumber(950)
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            getBigNumber(50)
        )

        await hash.sponsorProposal(1)
        
        expect(await tribute.cancelTributeProposal(hash.address, 1).should.be.reverted)

        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            getBigNumber(950)
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            getBigNumber(50)
        )
        expect(await purchaseToken.balanceOf(hash.address)).to.equal(
            getBigNumber(0)
        )
    })

    it("Should prevent cancellation of sponsored NFT tribute proposal", async function () {
        // Instantiate purchaseToken
        let PurchaseToken = await ethers.getContractFactory("HashNFT")
        let purchaseToken = await PurchaseToken.deploy(
            "NFT",
            "NFT"
        )
        await purchaseToken.deployed()
        await purchaseToken.mint(proposer.address, 1, "DOCS")

        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        
        await purchaseToken.approve(tribute.address, 1)

        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            true,
            purchaseToken.address,
            1
        )

        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            0
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            1
        )
        expect(await purchaseToken.ownerOf(1)).to.equal(
            tribute.address
        )

        await hash.sponsorProposal(1)
        
        expect(await tribute.cancelTributeProposal(hash.address, 1).should.be.reverted)

        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            0
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            1
        )
        expect(await purchaseToken.ownerOf(1)).to.equal(
            tribute.address
        )
        expect(await purchaseToken.balanceOf(hash.address)).to.equal(
            0
        )
    })

    it("Should return ETH tribute to proposer if proposal unsuccessful", async function () {
        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        // Instantiate Tribute
        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            false,
            "0x0000000000000000000000000000000000000000",
            getBigNumber(50),
            { value: getBigNumber(50), }
        )

        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            getBigNumber(50)
        )

        await hash.sponsorProposal(1)
        await hash.vote(1, false)
        await advanceTime(35)
        await hash.processProposal(1)
        await tribute.releaseTributeProposal(hash.address, 1)
        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            getBigNumber(0)
        )
        expect(await ethers.provider.getBalance(hash.address)).to.equal(
            getBigNumber(0)
        )
    })

    it("Should return ERC20 tribute to proposer if proposal unsuccessful", async function () {
        // Instantiate purchaseToken
        PurchaseToken = await ethers.getContractFactory("HashERC20")
        purchaseToken = await PurchaseToken.deploy()
        await purchaseToken.deployed()
        await purchaseToken.init(
            "Hash",
            "Hash",
            "DOCS",
            [proposer.address],
            [getBigNumber(1000)],
            false,
            proposer.address
        )
        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        
        await purchaseToken.approve(tribute.address, getBigNumber(50))

        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            false,
            purchaseToken.address,
            getBigNumber(50)
        )

        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            getBigNumber(950)
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            getBigNumber(50)
        )

        await hash.sponsorProposal(1)
        await hash.vote(1, false)
        await advanceTime(35)
        await hash.processProposal(1)
        await tribute.releaseTributeProposal(hash.address, 1)
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            getBigNumber(0)
        )
        expect(await purchaseToken.balanceOf(hash.address)).to.equal(
            getBigNumber(0)
        )
        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            getBigNumber(1000)
        )
    })

    it("Should return NFT tribute to proposer if proposal unsuccessful", async function () {
        // Instantiate purchaseToken
        let PurchaseToken = await ethers.getContractFactory("HashNFT")
        let purchaseToken = await PurchaseToken.deploy(
            "NFT",
            "NFT"
        )
        await purchaseToken.deployed()
        await purchaseToken.mint(proposer.address, 1, "DOCS")

        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        
        await purchaseToken.approve(tribute.address, 1)

        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            true,
            purchaseToken.address,
            1
        )
        
        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            0
        )
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            1
        )
        expect(await purchaseToken.ownerOf(1)).to.equal(
            tribute.address
        )

        await hash.sponsorProposal(1)
        await hash.vote(1, false)
        await advanceTime(35)
        await hash.processProposal(1)
        await tribute.releaseTributeProposal(hash.address, 1)
        expect(await purchaseToken.balanceOf(tribute.address)).to.equal(
            0
        )
        expect(await purchaseToken.balanceOf(hash.address)).to.equal(
            0
        )
        expect(await purchaseToken.balanceOf(proposer.address)).to.equal(
            1
        )
        expect(await purchaseToken.ownerOf(1)).to.equal(
            proposer.address
        )
    })

    it("Should prevent tribute return to proposer if proposal not processed", async function () {
        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        // Instantiate Tribute
        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            false,
            "0x0000000000000000000000000000000000000000",
            getBigNumber(50),
            { value: getBigNumber(50), }
        )

        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            getBigNumber(50)
        )

        await hash.sponsorProposal(1)
        await hash.vote(1, true)
        await advanceTime(35)
        expect(await tribute.releaseTributeProposal(hash.address, 1).should.be.reverted)
        expect(await tribute.releaseTributeProposal(hash.address, 2).should.be.reverted)
        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            getBigNumber(50)
        )
        expect(await ethers.provider.getBalance(hash.address)).to.equal(
            getBigNumber(0)
        )
    })

    it("Should prevent release call if already completed", async function () {
        // Instantiate HashDAO
        await hash.init(
          "Hash",
          "Hash",
          "DOCS",
          false,
          [],
          [],
          [proposer.address],
          [getBigNumber(10)],
          [30, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        )
        // Instantiate Tribute
        await tribute.submitTributeProposal(
            hash.address,
            0,
            "TRIBUTE",
            [proposer.address],
            [getBigNumber(1000)],
            [0x00],
            false,
            "0x0000000000000000000000000000000000000000",
            getBigNumber(50),
            { value: getBigNumber(50), }
        )

        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            getBigNumber(50)
        )

        await hash.sponsorProposal(1)
        await hash.vote(1, false)
        await advanceTime(35)
        await hash.processProposal(1)
        await tribute.releaseTributeProposal(hash.address, 1)
        expect(await ethers.provider.getBalance(tribute.address)).to.equal(
            getBigNumber(0)
        )
        expect(await ethers.provider.getBalance(hash.address)).to.equal(
            getBigNumber(0)
        )
        expect(await tribute.releaseTributeProposal(hash.address, 1).should.be.reverted)
    })
})

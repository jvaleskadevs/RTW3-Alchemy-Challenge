const chai = require("chai")
const expect = chai.expect
const { ethers } = require("hardhat")
chai.use(require('chai-as-promised'))

const valA = ethers.utils.keccak256(0xBAD060A7)
const hashA = ethers.utils.keccak256(valA)
const valBwin = ethers.utils.keccak256(0x600D60A7)
const valBlose = ethers.utils.keccak256(0xBAD060A7)
const hashBWin = ethers.utils.keccak256(valBwin)
const hashBLose = ethers.utils.keccak256(valBlose)

// Chai's expect(<operation>).to.be.revertedWith behaves
// strangely, so I'm implementing that functionality myself
// with try/catch
const interpretErr = err => {
  if (err.reason)
    return err.reason
  else
    return err.stackTrace[0].message.value.toString('ascii')
}

describe("CasinoV3", async () => {
  it("Not allow you to propose a zero wei bet", async () => {
    f = await ethers.getContractFactory("CasinoV3")
    c = await f.deploy()

    try {
      tx = await c.proposeBet(hashA)
      rcpt = await tx.wait()

      // If we get here, it's a fail
      expect("this").to.equal("fail")
    } catch(err) {
      expect(interpretErr(err)).to
        .match(/Bet amount must not be zero/)
    }
  })   // it "Not allow you to bet zero wei"

  it("Not allow you to accept a bet that doesn't exist", async () => {
    f = await ethers.getContractFactory("CasinoV3")
    c = await f.deploy()

    try {
      tx = await c.acceptBet(hashA, hashBWin, {value: 10})
      rcpt = await tx.wait()
      expect("this").to.equal("fail")
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Nobody made that bet/)
    }
  })   // it "Not allow you to accept a bet that doesn't exist" 

  it("Allow you to propose and accept bets", async () => {
    f = await ethers.getContractFactory("CasinoV3")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    tx = await c.acceptBet(hashA, hashBWin, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")      
  })   // it "Allow you to accept a bet"

  it("Not allow you to accept an already accepted bet", async () => {
    f = await ethers.getContractFactory("CasinoV3")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    tx = await c.acceptBet(hashA, hashBWin, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")
    try {
      tx = await c.acceptBet(hashA, hashBWin, {value: 10})
      rcpt = await tx.wait()   
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Bet already accepted/)
    }          
  })   // it "Not allow you to accept an already accepted bet" 


  it("Not allow you to accept with the wrong amount", async () => {
    f = await ethers.getContractFactory("CasinoV3")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    try {
      tx = await c.acceptBet(hashA, hashBWin, {value: 11})
      rcpt = await tx.wait()   
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Need to bet the same amount as sideA/)
    }          
  })   // it "Not allow you to accept with the wrong amount"   


  it("Not allow you to reveal with wrong value", async () => {
    f = await ethers.getContractFactory("CasinoV3")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    tx = await c.acceptBet(hashA, hashBWin, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")
    try {
      tx = await c.revealSideA(hashA, valBwin)
      rcpt = await tx.wait()   
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Wrong value/)
    }          
  })   // it "Not allow you to accept an already accepted bet" 


  it("Not allow you to reveal before bet is accepted", async () => {
    f = await ethers.getContractFactory("CasinoV3")
    c = await f.deploy()

    tx = await c.proposeBet(hashA, {value: 10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")
    try {
      tx = await c.revealSideA(hashA, valA)
      rcpt = await tx.wait()   
      expect("this").to.equal("fail")      
    } catch (err) {
        expect(interpretErr(err)).to
          .match(/Bet has not been accepted yet/)
    }          
  })   // it "Not allow you to reveal before bet is accepted"  

  it("Work all the way through (B wins)", async () => {
    signer = await ethers.getSigners()
    f = await ethers.getContractFactory("CasinoV3")
    cA = await f.deploy()
    cB = cA.connect(signer[1])

    tx = await cA.proposeBet(hashA, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")

    tx = await cB.acceptBet(hashA, hashBWin, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")      

    // A sends the transaction, so the change due to the
    // bet will only be clearly visible in B

        
    tx = await cA.revealSideA(hashA, valA)
    rcpt = await tx.wait()
    preBalanceA = await ethers.provider.getBalance(signer[0].address)
    tx = await cB.revealSideB(hashA, valBwin)
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetSettled")
    
    postBalanceA = await ethers.provider.getBalance(signer[0].address)        
     
    deltaA = postBalanceA.sub(preBalanceA)
    expect(deltaA.toNumber()).to.equal(0)   


  })   // it "Work all the way through (B wins)"


  it("Work all the way through (A wins)", async () => {
    signer = await ethers.getSigners()
    f = await ethers.getContractFactory("CasinoV3")
    cA = await f.deploy()
    cB = cA.connect(signer[1])

    tx = await cA.proposeBet(hashA, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")

    tx = await cB.acceptBet(hashA, hashBLose, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted")      

    // A sends the transaction, so the change due to the
    // bet will only be clearly visible in B    
    tx = await cA.revealSideA(hashA, valA)
    rcpt = await tx.wait()
    preBalanceA = await ethers.provider.getBalance(signer[0].address)
    tx = await cB.revealSideB(hashA, valBlose)
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetSettled")
    postBalanceA = await ethers.provider.getBalance(signer[0].address)    
 
    deltaA = postBalanceA.sub(preBalanceA)
    expect(deltaA.toNumber()).to.equal(2e10) 
  })   // it "Work all the way through (A wins)"
  
  it("Work all the way through (A claim prize)", async () => {
  	signer = await ethers.getSigners()
  	f = await ethers.getContractFactory("CasinoV3")
  	cA = await f.deploy()
  	cB = cA.connect(signer[1])
  	
    tx = await cA.proposeBet(hashA, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetProposed")

    tx = await cB.acceptBet(hashA, hashBLose, {value: 1e10})
    rcpt = await tx.wait()
    expect(rcpt.events[0].event).to.equal("BetAccepted") 
    
  	tx = await cA.revealSideA(hashA, valA)
  	rcpt = await tx.wait()
  	
  	preBalanceA = await ethers.provider.getBalance(signer[0].address)
  	setTimeout(async () => {
  		tx = await cA.claimPrize()
  		rcpt = await tx.wait()
     	expect(rcpt.events[0].event).to.equal("BetSettled")
    	postBalanceA = await ethers.provider.getBalance(signer[0].address) 	
    	deltaA = postBalanceA.sub(preBalanceA)
		expect(deltaA.toNumber()).to.equal(2e10) 
  	}, 181)
  })


})     // describe("CasinoV3")

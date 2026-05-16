const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTTicket", function () {
  let contract, owner, alice, bob;

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const F = await ethers.getContractFactory("NFTTicket");
    contract = await F.deploy();
    await contract.waitForDeployment();
  });

  function makeHash(secret, tokenId) {
    return ethers.keccak256(
      ethers.solidityPacked(["bytes32", "uint256"], [secret, tokenId])
    );
  }

  it("deploys with owner set", async () => {
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("mints a ticket and emits event", async () => {
    const secret = ethers.hexlify(ethers.randomBytes(32));
    const hash = makeHash(secret, 0);
    await expect(contract.mint(alice.address, "DevCon", hash))
      .to.emit(contract, "TicketMinted")
      .withArgs(alice.address, 0, "DevCon", hash);
    expect(await contract.ownerOf(0)).to.equal(alice.address);
  });

  it("rejects mint from non-owner", async () => {
    const secret = ethers.hexlify(ethers.randomBytes(32));
    const hash = makeHash(secret, 0);
    await expect(
      contract.connect(alice).mint(alice.address, "DevCon", hash)
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });

  it("checks in with valid hash", async () => {
    const secret = ethers.hexlify(ethers.randomBytes(32));
    const hash = makeHash(secret, 0);
    await contract.mint(alice.address, "DevCon", hash);
    await expect(contract.checkIn(0, hash))
      .to.emit(contract, "TicketCheckedIn")
      .withArgs(0);
    const info = await contract.getTicket(0);
    expect(info.used).to.be.true;
  });

  it("rejects check-in with wrong hash", async () => {
    const secret = ethers.hexlify(ethers.randomBytes(32));
    const hash = makeHash(secret, 0);
    await contract.mint(alice.address, "DevCon", hash);
    const badHash = makeHash(ethers.hexlify(ethers.randomBytes(32)), 0);
    await expect(contract.checkIn(0, badHash)).to.be.revertedWith("Invalid check-in hash");
  });

  it("rejects double check-in", async () => {
    const secret = ethers.hexlify(ethers.randomBytes(32));
    const hash = makeHash(secret, 0);
    await contract.mint(alice.address, "DevCon", hash);
    await contract.checkIn(0, hash);
    await expect(contract.checkIn(0, hash)).to.be.revertedWith("Ticket already used");
  });

  it("rejects check-in from non-owner", async () => {
    const secret = ethers.hexlify(ethers.randomBytes(32));
    const hash = makeHash(secret, 0);
    await contract.mint(alice.address, "DevCon", hash);
    await expect(
      contract.connect(alice).checkIn(0, hash)
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });

  it("totalMinted increments correctly", async () => {
    expect(await contract.totalMinted()).to.equal(0);
    for (let i = 0; i < 3; i++) {
      const s = ethers.hexlify(ethers.randomBytes(32));
      await contract.mint(alice.address, "E" + i, makeHash(s, i));
    }
    expect(await contract.totalMinted()).to.equal(3);
  });
});

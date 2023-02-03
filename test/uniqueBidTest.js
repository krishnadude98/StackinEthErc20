const { ethers } = require("hardhat");
const { expert, assert, expect } = require("chai");

describe("Unique bid", function () {
    let uniqueBidFactory, uniqueBid;
    let p1, p2, p3;
    beforeEach(async function () {
        uniqueBidFactory = await ethers.getContractFactory("uniqueBid");
        uniqueBid = await uniqueBidFactory.deploy("7");
        [p1, p2, p3, _] = await ethers.getSigners();
    });

    it("Picks correct winner", async function () {
        const value = await uniqueBid.owner();
        await uniqueBid.connect(p2).makeBid(7);
        await uniqueBid.connect(p3).makeBid(8);
        await uniqueBid.connect(p1).stopGame();
        await uniqueBid.connect(p1).pickWinner();
        let winner = await uniqueBid.winner();
        assert.equal(winner, p2.address);
    });

    it("No winner case ", async function () {
        const value = await uniqueBid.owner();
        await uniqueBid.connect(p2).makeBid(8);
        await uniqueBid.connect(p3).makeBid(8);
        await uniqueBid.connect(p1).stopGame();

        await expect(uniqueBid.connect(p1).pickWinner()).to.be.revertedWith(
            "No unique bid"
        );
    });

    it("Lists player choices", async function () {
        const value = await uniqueBid.owner();
        await uniqueBid.connect(p2).makeBid(7);
        await uniqueBid.connect(p3).makeBid(8);
        await uniqueBid.connect(p1).stopGame();
        await uniqueBid.connect(p1).pickWinner();
        let list = await uniqueBid.getBids();
        assert.equal(list.length, 2);
    });

    it("Set Range Works", async function () {
        await uniqueBid.connect(p1).setRange(2, 50);
        let lrange = await uniqueBid.connect(p1).lowerRange();
        let rrange = await uniqueBid.connect(p2).upperRange();
        assert.equal(lrange, 2);
        assert.equal(rrange, 50);
    });

    it("Game will end when owner stops it", async function () {
        const value = await uniqueBid.owner();
        await uniqueBid.connect(p2).makeBid(7);
        await uniqueBid.connect(p3).makeBid(8);
        await uniqueBid.connect(p1).stopGame();
        let gamestoped = await uniqueBid.connect(p3).gameEnded();
        assert.equal(gamestoped, true);
    });
});

const { ethers } = require("hardhat");
const { expert, assert, expect } = require("chai");
const { time, mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("Stacking", function () {
    let stackingBidFactory, stackingTokensFactory, rewardTokensFactory;
    let p1, p2, p3;
    beforeEach(async function () {
        stackingBidFactory = await ethers.getContractFactory("Stacking");
        stackingTokensFactory = await ethers.getContractFactory("Stake");
        rewardTokensFactory = await ethers.getContractFactory("GoofyGoober");
        stackingContract = await stackingBidFactory.deploy();
        stackingTokenContract = await stackingTokensFactory.deploy();
        rewardTokenContract = await rewardTokensFactory.deploy(
            stackingContract.address
        );

        [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15] =
            await ethers.getSigners();
    });
    it("setAdresses works", async function () {
        await stackingContract.connect(p1).setAdresses(p2.address);
        let value = await stackingContract.connect(p1).Erc20();
        assert.equal(value, p2.address);
    });

    it("sets admin address", async function () {
        let value = await stackingContract.connect(p1).admin();
        assert.equal(value, p1.address);
    });

    it("setAcceptedTokens works", async function () {
        await stackingContract.connect(p1).setAcceptedTokens(p2.address);
        let value = await stackingContract
            .connect(p1)
            .whitelistedErc20(p2.address);
        assert.equal(value, true);
    });

    it("user able to stake tokens", async function () {
        await stackingTokenContract.connect(p1).mint(p2.address, 500);

        await stackingTokenContract
            .connect(p2)
            .approve(stackingContract.address, 500);
        await stackingContract
            .connect(p1)
            .setAcceptedTokens(stackingTokenContract.address);
        await stackingContract
            .connect(p2)
            .stakeErc20(stackingTokenContract.address, 500);

        let value = await stackingContract
            .connect(p2)
            .stackersErc20(p2.address);
        assert.equal(value.user, p2.address);
        assert.equal(value.token, stackingTokenContract.address);
        assert.equal(value.amount, 500);
        assert.equal(value.isStaked, true);
        let bal = await stackingTokenContract.connect(p2).balanceOf(p2.address);
        assert.equal(bal, 0);
    });

    it("stacking wont accept non whitelisted erc20 tokens", async function () {
        await stackingTokenContract.connect(p1).mint(p2.address, 500);
        await stackingTokenContract
            .connect(p2)
            .approve(stackingContract.address, 500);
        await expect(
            stackingContract
                .connect(p2)
                .stakeErc20(stackingTokenContract.address, 500)
        ).to.be.revertedWithCustomError(
            stackingContract,
            "Token__NotAcceptedAsPayment"
        );
    });

    it("stacking wont work to stack multiple erc20 tokens", async function () {
        await stackingTokenContract.connect(p1).mint(p2.address, 500);

        await stackingTokenContract
            .connect(p2)
            .approve(stackingContract.address, 500);
        await stackingContract
            .connect(p1)
            .setAcceptedTokens(stackingTokenContract.address);
        await stackingContract
            .connect(p2)
            .stakeErc20(stackingTokenContract.address, 200);
        await expect(
            stackingContract
                .connect(p2)
                .stakeErc20(stackingTokenContract.address, 300)
        ).to.be.revertedWithCustomError(
            stackingContract,
            "User__AlreadyStacked"
        );
    });

    it("user able to stake ETH", async function () {
        await stackingContract
            .connect(p2)
            .stakeEth({ value: ethers.utils.parseUnits("1000", 0) });
        let value = await stackingContract.connect(p2).stackersEth(p2.address);
        assert.equal(value.user, p2.address);
        assert.equal(value.amount, 1000);
        assert.equal(value.isStaked, true);
    });

    it("stacking wont work to stack multiple ETH tokens", async function () {
        await stackingContract
            .connect(p2)
            .stakeEth({ value: ethers.utils.parseUnits("1000", 0) });

        await expect(
            stackingContract
                .connect(p2)
                .stakeEth({ value: ethers.utils.parseUnits("1000", 0) })
        ).to.be.revertedWithCustomError(
            stackingContract,
            "User__AlreadyStacked"
        );
    });
    it("user able to withdraw tokens after 1 week", async function () {
        await stackingTokenContract.connect(p1).mint(p2.address, 500);

        await stackingTokenContract
            .connect(p2)
            .approve(stackingContract.address, 500);
        await stackingContract
            .connect(p1)
            .setAcceptedTokens(stackingTokenContract.address);
        await stackingContract
            .connect(p2)
            .stakeErc20(stackingTokenContract.address, 500);

        await mine(604800);
        await stackingContract.connect(p2).withdrawErc20();
        let balance = await stackingTokenContract
            .connect(p2)
            .balanceOf(p2.address);
        assert.equal(500, balance);
    });
    it("user wont't able withdraw tokens if not stacked ", async function () {
        await stackingTokenContract.connect(p1).mint(p2.address, 500);

        await stackingTokenContract
            .connect(p2)
            .approve(stackingContract.address, 500);
        await stackingContract
            .connect(p1)
            .setAcceptedTokens(stackingTokenContract.address);
        await mine(604800);
        await expect(
            stackingContract.connect(p2).withdrawErc20()
        ).to.be.revertedWithCustomError(
            stackingContract,
            "Staking__NeedsMoreThanZero"
        );
    });
    it("user wont't able withdraw tokens again  ", async function () {
        await stackingTokenContract.connect(p1).mint(p2.address, 500);

        await stackingTokenContract
            .connect(p2)
            .approve(stackingContract.address, 500);
        await stackingContract
            .connect(p1)
            .setAcceptedTokens(stackingTokenContract.address);
        await stackingContract
            .connect(p2)
            .stakeErc20(stackingTokenContract.address, 500);

        await mine(604800);
        await stackingContract.connect(p2).withdrawErc20();
        await expect(
            stackingContract.connect(p2).withdrawErc20()
        ).to.be.revertedWithCustomError(
            stackingContract,
            "Token__AlreadyWithdrawed"
        );
    });
    it("user able to withdraw ETH", async function () {
        await stackingContract
            .connect(p2)
            .stakeEth({ value: ethers.utils.parseUnits("1000", 0) });
        await mine(604800);
        let balance1 = await ethers.provider.getBalance(
            stackingContract.address
        );
        assert.equal(balance1, 1000);
        await stackingContract.connect(p2).withdrawEth();
        let balance2 = await ethers.provider.getBalance(
            stackingContract.address
        );
        assert.equal(balance2, 0);
    });
    it("user won't be able to withdraw ETH if not stacked", async function () {
        await mine(604800);

        await expect(
            stackingContract.connect(p2).withdrawEth()
        ).to.be.revertedWithCustomError(
            stackingContract,
            "Staking__NeedsMoreThanZero"
        );
    });
    it("user won't be able to withdraw ETH already withdrawed", async function () {
        await stackingContract
            .connect(p2)
            .stakeEth({ value: ethers.utils.parseUnits("1000", 0) });
        await mine(604800);
        stackingContract.connect(p2).withdrawEth();
        await expect(
            stackingContract.connect(p2).withdrawEth()
        ).to.be.revertedWithCustomError(
            stackingContract,
            "Eth__AlreadyWithdrawed"
        );
    });

    it("user able to claim tokens after withdrawing (1 week)", async function () {
        await stackingTokenContract.connect(p1).mint(p2.address, 500);

        await stackingTokenContract
            .connect(p2)
            .approve(stackingContract.address, 500);
        await stackingContract
            .connect(p1)
            .setAcceptedTokens(stackingTokenContract.address);
        await stackingContract
            .connect(p1)
            .setAdresses(rewardTokenContract.address);
        await stackingContract
            .connect(p2)
            .stakeErc20(stackingTokenContract.address, 500);
        const sevenDays = 7 * 24 * 60 * 60;
        await mine(sevenDays);
        await stackingContract.connect(p2).withdrawErc20();
        await mine(1);
        await stackingContract.connect(p2).claimRewardErc20();
        let balance = await rewardTokenContract
            .connect(p2)
            .balanceOf(p2.address);
        assert.equal(balance, 1000);
    });
    it("user able to claim tokens after withdrawing (2 week)", async function () {
        await stackingTokenContract.connect(p1).mint(p2.address, 500);

        await stackingTokenContract
            .connect(p2)
            .approve(stackingContract.address, 500);
        await stackingContract
            .connect(p1)
            .setAcceptedTokens(stackingTokenContract.address);
        await stackingContract
            .connect(p1)
            .setAdresses(rewardTokenContract.address);
        await stackingContract
            .connect(p2)
            .stakeErc20(stackingTokenContract.address, 500);

        const fourteenDays = 14 * 24 * 60 * 60;
        await mine(fourteenDays);
        await stackingContract.connect(p2).withdrawErc20();
        await stackingContract.connect(p2).claimRewardErc20();

        let balance = await rewardTokenContract
            .connect(p2)
            .balanceOf(p2.address);
        assert.equal(balance, 2000);
    });

    it("user able to claim tokens without withdrawing (1 week)", async function () {
        await stackingTokenContract.connect(p1).mint(p2.address, 500);

        await stackingTokenContract
            .connect(p2)
            .approve(stackingContract.address, 500);
        await stackingContract
            .connect(p1)
            .setAcceptedTokens(stackingTokenContract.address);
        await stackingContract
            .connect(p1)
            .setAdresses(rewardTokenContract.address);
        await stackingContract
            .connect(p2)
            .stakeErc20(stackingTokenContract.address, 500);
        const sevenDays = 7 * 24 * 60 * 60;
        await ethers.provider.send("evm_increaseTime", [sevenDays]);
        await ethers.provider.send("evm_mine");
        await mine(1);
        await stackingContract.connect(p2).claimRewardErc20();
        let balance = await rewardTokenContract
            .connect(p2)
            .balanceOf(p2.address);
        assert.equal(balance, 1000);
    });
    it("user able to claim tokens without withdrawing for (1 week) and then withdrawing in 2nd week", async function () {
        await stackingTokenContract.connect(p1).mint(p2.address, 500);

        await stackingTokenContract
            .connect(p2)
            .approve(stackingContract.address, 500);
        await stackingContract
            .connect(p1)
            .setAcceptedTokens(stackingTokenContract.address);
        await stackingContract
            .connect(p1)
            .setAdresses(rewardTokenContract.address);
        await stackingContract
            .connect(p2)
            .stakeErc20(stackingTokenContract.address, 500);
        const sevenDays = 7 * 24 * 60 * 60;
        await mine(sevenDays);
        await stackingContract.connect(p2).claimRewardErc20();
        await mine(sevenDays);
        await stackingContract.connect(p2).withdrawErc20();
        await stackingContract.connect(p2).claimRewardErc20();
        let balance = await rewardTokenContract
            .connect(p2)
            .balanceOf(p2.address);
        assert.equal(balance, 2000);
    });
    it("users able to cliam token by staking eth", async function () {
        await stackingContract.connect(p2).stakeEth({ value: 10000 });
        await stackingContract
            .connect(p1)
            .setAdresses(rewardTokenContract.address);
        const sevenDays = 7 * 24 * 60 * 60;
        await mine(sevenDays);
        await stackingContract.connect(p2).claimRewardEth();
        await stackingContract.connect(p2).withdrawEth();
        let balance = await rewardTokenContract
            .connect(p2)
            .balanceOf(p2.address);
        assert.equal(500, balance);
    });
    it("users able to cliam token by staking eth without withdrawing for (1 week) and then withdrawing in 2nd week", async function () {
        await stackingContract.connect(p2).stakeEth({ value: 10000 });
        await stackingContract
            .connect(p1)
            .setAdresses(rewardTokenContract.address);
        const sevenDays = 7 * 24 * 60 * 60;
        await mine(sevenDays);
        await stackingContract.connect(p2).claimRewardEth();
        await mine(sevenDays);
        await stackingContract.connect(p2).withdrawEth();
        await stackingContract.connect(p2).claimRewardEth();
        let balance = await rewardTokenContract
            .connect(p2)
            .balanceOf(p2.address);
        assert.equal(1000, balance);
    });
    it("wont generate rewards tokens if stacked Eth is withdrawed", async function () {
        await stackingContract.connect(p2).stakeEth({ value: 10000 });
        await stackingContract
            .connect(p1)
            .setAdresses(rewardTokenContract.address);
        const sevenDays = 7 * 24 * 60 * 60;
        await mine(sevenDays);
        await stackingContract.connect(p2).claimRewardEth();
        await mine(sevenDays);
        await stackingContract.connect(p2).withdrawEth();
        await mine(sevenDays);
        await mine(sevenDays);
        await stackingContract.connect(p2).claimRewardEth();
        let balance = await rewardTokenContract
            .connect(p2)
            .balanceOf(p2.address);
        assert.equal(balance, 1000);
    });
    it("wont generate rewards tokens if stacked token amount is withdrawed", async function () {
        await stackingTokenContract.connect(p1).mint(p2.address, 500);

        await stackingTokenContract
            .connect(p2)
            .approve(stackingContract.address, 500);
        await stackingContract
            .connect(p1)
            .setAcceptedTokens(stackingTokenContract.address);
        await stackingContract
            .connect(p1)
            .setAdresses(rewardTokenContract.address);
        await stackingContract
            .connect(p2)
            .stakeErc20(stackingTokenContract.address, 500);
        const sevenDays = 7 * 24 * 60 * 60;
        await mine(sevenDays);
        await stackingContract.connect(p2).claimRewardErc20();
        await mine(sevenDays);
        await stackingContract.connect(p2).withdrawErc20();
        await mine(sevenDays);
        await mine(sevenDays);
        await stackingContract.connect(p2).claimRewardErc20();
        let balance = await rewardTokenContract
            .connect(p2)
            .balanceOf(p2.address);
        assert.equal(balance, 2000);
    });
    it("total supply of reward is tracked correctly ", async function () {
        await stackingTokenContract.connect(p1).mint(p2.address, 500);
        await stackingContract.connect(p3).stakeEth({ value: 10000 });
        await stackingTokenContract
            .connect(p2)
            .approve(stackingContract.address, 500);
        await stackingContract
            .connect(p1)
            .setAcceptedTokens(stackingTokenContract.address);
        await stackingContract
            .connect(p1)
            .setAdresses(rewardTokenContract.address);
        await stackingContract
            .connect(p2)
            .stakeErc20(stackingTokenContract.address, 500);
        const sevenDays = 7 * 24 * 60 * 60;
        await mine(sevenDays);
        await stackingContract.connect(p2).claimRewardErc20();
        await mine(sevenDays);
        await stackingContract.connect(p2).withdrawErc20();
        await stackingContract.connect(p2).claimRewardErc20();
        await stackingContract.connect(p3).claimRewardEth();
        await stackingContract.connect(p3).withdrawEth();
        let totalSUpply = await stackingContract
            .connect(p3)
            .totalSupplyReward();
        assert.equal(3000, totalSUpply);
    });
});

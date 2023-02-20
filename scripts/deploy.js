const { ethers, run, network } = require("hardhat");
require("dotenv").config();
async function main() {
    const stackingFactory = await ethers.getContractFactory("Stacking");
    const rewardFactory = await ethers.getContractFactory("GoofyGoober");
    console.log("Deploying Contract....");
    const stacking = await stackingFactory.deploy();
    await stacking.deployed();
    const rewards = await rewardFactory.deploy(`${stacking.address}`);
    await rewards.deployed();
    console.log(`Deployed Stacking contract address: ${stacking.address}`);
    console.log(`Deloyed Reward Contract address: ${rewards.address}`);
    if (network.config.chainId === 80001 && process.env.POLYGON_API_KEY) {
        console.log("Waiting for block confirmations...");
        await stacking.deployTransaction.wait(6);
        await verify(stacking.address, []);
        await rewards.deployTransaction.wait(6);
        await verify(stacking.address, [stacking.address]);
    }
}

// async function verify(contractAddress, args) {
const verify = async (contractAddress, args) => {
    console.log("Verifying contract...");
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!");
        } else {
            console.log(e);
        }
    }
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

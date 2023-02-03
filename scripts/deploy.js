const { ethers, run, network } = require("hardhat");
require("dotenv").config();
async function main() {
    const uniqueBidFactory = await ethers.getContractFactory("uniqueBid");
    console.log("Deploying Contract");
    const uniqueBid = await uniqueBidFactory.deploy(process.env.OFFSET);
    await uniqueBid.deployed();
    console.log(`Deployed contract address: ${uniqueBid.address}`);
    console.log(network);
    if (network.config.chainid === 80001 && process.env.POLYGON_API_KEY) {
        console.log("Waiting for block confirmations...");
        await uniqueBid.deployTransaction.wait(6);
        await verify(uniqueBid.address, [process.env.OFFSET]);
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

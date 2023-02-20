# Hari Krishna Stacking Project

## QUICK START

1. `npm install`

2. **write .env file for the required inputs**

3. `npx hardhat run scripts/deploy.js --network NETWORK` To Deploy Code (polygon-mumbai,gorelli and localhost i s pre configured)

4. `npx hardhat test` To Test Code

## Introduction

-   This stacking contract accepts both Ethereum tokens as well as whitelisted erc20 tokens for stacking and the rewards are claimable once the stacking period has reached 1 week cap
-   The contract auto coumponds rewards weekly until users is stacked
-   Users needs to approve tokens at the staking contract address

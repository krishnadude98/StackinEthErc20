// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
error Staking__TransferFailed();
error Withdraw__TransferFailed();
error ClaimTransferFailed();
error Staking__NeedsMoreThanZero();
error User__AlreadyStacked();
error NotAuthorized();
error User__NonSufficientFunds();
error Token__NotAcceptedAsPayment();
error Token__BalanceInsuffient();
error Token__AllowenceInsuffient();
error Eth__AlreadyWithdrawed();
error Token__AlreadyWithdrawed();
error Reward__RewardAlreadyClaimed();
error Reward__RequiresAtleastOneWeek();

contract Stacking is ReentrancyGuard {
    address public Erc20;
    address public admin;
    uint public constant REWARD_RATE_TOKEN_PER_WEEK = 2;
    uint public constant REWARD_RATE_PER_1000WEI_PER_WEEK = 50;
    uint public totalSupplyReward;
    enum Currency {
        ETH,
        TOKEN
    }

    struct StakingId {
        address user;
        address token;
        Currency token_currency;
        uint amount;
        uint rewardAmount;
        uint stakedTime;
        bool isStaked;
        bool isWithdrawed;
        uint withdrawedTime;
        bool isClaimed;
    }

    mapping(address => StakingId) public stackersEth;
    mapping(address => StakingId) public stackersErc20;
    mapping(address => uint32) numStacked;
    mapping(address => bool) public whitelistedErc20;

    constructor() {
        admin = msg.sender;
    }

    function setAdresses(address _Erc20) public isAdmin {
        Erc20 = _Erc20;
    }

    function setAcceptedTokens(address _Erc20) public isAdmin {
        whitelistedErc20[_Erc20] = true;
    }

    function stakeEth() public payable {
        if (stackersEth[msg.sender].isStaked == true)
            revert User__AlreadyStacked();
        if (msg.value < 1000) revert User__NonSufficientFunds();
        stackersEth[msg.sender] = StakingId(
            msg.sender,
            address(0),
            Currency.ETH,
            msg.value,
            0,
            block.timestamp,
            true,
            false,
            0,
            false
        );
        numStacked[msg.sender]++;
    }

    function stakeErc20(address _tokenAdress, uint _amount) public {
        if (stackersErc20[msg.sender].isStaked == true)
            revert User__AlreadyStacked();
        if (!whitelistedErc20[_tokenAdress])
            revert Token__NotAcceptedAsPayment();
        IERC20 erc20 = IERC20(_tokenAdress);
        uint256 balance = erc20.balanceOf(msg.sender);
        if (balance == 0) revert Token__BalanceInsuffient();
        uint256 allowance = erc20.allowance(msg.sender, address(this));
        if (allowance == 0) revert Token__AllowenceInsuffient();
        stackersErc20[msg.sender].isStaked = true;
        bool success = erc20.transferFrom(msg.sender, address(this), _amount);
        if (!success) {
            revert Staking__TransferFailed();
        }
        stackersErc20[msg.sender] = StakingId(
            msg.sender,
            _tokenAdress,
            Currency.TOKEN,
            _amount,
            0,
            block.timestamp,
            true,
            false,
            0,
            false
        );
        numStacked[msg.sender]++;
    }

    function withdrawEth() public {
        if(stackersEth[msg.sender].isWithdrawed) revert Eth__AlreadyWithdrawed();
        if (stackersEth[msg.sender].amount == 0) revert Staking__NeedsMoreThanZero();
        address payable receiver = payable(msg.sender);
        stackersEth[msg.sender].isWithdrawed= true;
        stackersEth[msg.sender].withdrawedTime= block.timestamp;
        receiver.transfer(stackersEth[msg.sender].amount);
    }

    function withdrawErc20() public {
        if(stackersErc20[msg.sender].isWithdrawed) revert Token__AlreadyWithdrawed();
        if (stackersErc20[msg.sender].amount == 0) revert Staking__NeedsMoreThanZero();
        stackersErc20[msg.sender].isWithdrawed= true;
        stackersErc20[msg.sender].withdrawedTime= block.timestamp;
        IERC20 erc20 = IERC20(stackersErc20[msg.sender].token);
        erc20.transfer(msg.sender, (stackersErc20[msg.sender].amount));
    }

    function claimRewardEth() public {
        if(!stackersEth[msg.sender].isStaked) revert Staking__NeedsMoreThanZero();
        if(stackersEth[msg.sender].isClaimed) revert Reward__RewardAlreadyClaimed();
        if(stackersEth[msg.sender].stakedTime + 604800 > block.timestamp) revert Reward__RequiresAtleastOneWeek();
        uint rewardAmt;
        IERC20 rewardErc20 = IERC20(Erc20);
        if(!stackersEth[msg.sender].isWithdrawed){
            rewardAmt= calculateRewardEth(msg.sender);
            stackersEth[msg.sender].stakedTime= block.timestamp;
        }
        else{
            rewardAmt= calculateRewardEth(msg.sender);
             stackersEth[msg.sender].isClaimed=true;
        }
        totalSupplyReward= totalSupplyReward+rewardAmt;
        bool sucess=rewardErc20.transfer(msg.sender,rewardAmt);
        if(!sucess) revert ClaimTransferFailed();
    }

    function claimRewardErc20() public {
        if(!stackersErc20[msg.sender].isStaked) revert Staking__NeedsMoreThanZero();
        if(stackersErc20[msg.sender].isClaimed) revert Reward__RewardAlreadyClaimed();
        if(stackersErc20[msg.sender].stakedTime + 1 weeks > block.timestamp) revert Reward__RequiresAtleastOneWeek();
        uint rewardAmt;
        IERC20 rewardErc20 = IERC20(Erc20);
        if(!stackersErc20[msg.sender].isWithdrawed){
            rewardAmt= calculateRewardErc20(msg.sender);
            if(rewardAmt==0) revert Reward__RequiresAtleastOneWeek();
            stackersErc20[msg.sender].stakedTime= block.timestamp;
        }
        else{
            rewardAmt= calculateRewardErc20(msg.sender);
            if(rewardAmt==0) revert Reward__RequiresAtleastOneWeek();
            stackersErc20[msg.sender].isClaimed=true;
        }
        totalSupplyReward= totalSupplyReward+rewardAmt;
        bool sucess=rewardErc20.transfer(msg.sender,rewardAmt);
        
        if(!sucess) revert ClaimTransferFailed();
    }

    function getRewardsEth(address _user) public view returns (uint) {
        return calculateRewardEth( _user);
    }

    function getRewardsErc20(address _user) public view returns (uint) {
        return calculateRewardErc20( _user);
    }

    function calculateRewardEth(address _user) private view returns (uint) {
        uint stackedTimeWeeks;
        if (stackersEth[_user].amount == 0)
            revert Staking__NeedsMoreThanZero();
        if(stackersEth[_user].isWithdrawed){
            stackedTimeWeeks = (stackersEth[_user].withdrawedTime -
            stackersEth[_user].stakedTime) / 604800;
        }else{
            stackedTimeWeeks = (block.timestamp -
            stackersEth[_user].stakedTime) / 604800;
        }
         
        uint tokenAmt = stackersEth[_user].amount / 1000;
        return (REWARD_RATE_PER_1000WEI_PER_WEEK * stackedTimeWeeks * tokenAmt);
    }

    function calculateRewardErc20(address _user) private view returns (uint) {
        uint stackedTimeWeeks;
        if (stackersErc20[_user].amount == 0)
            revert Staking__NeedsMoreThanZero();
        if(stackersErc20[_user].isWithdrawed){
            stackedTimeWeeks = (stackersErc20[_user].withdrawedTime -
            stackersErc20[_user].stakedTime) / 1 weeks ;
        }
        else{
            stackedTimeWeeks = (block.timestamp -
            stackersErc20[_user].stakedTime) / 1 weeks;
        }
         
        uint tokenAmt = stackersErc20[_user].amount;
        return (REWARD_RATE_TOKEN_PER_WEEK * stackedTimeWeeks * tokenAmt);
    }

    modifier isAdmin() {
        if (msg.sender != admin) revert NotAuthorized();
        _;
    }
}

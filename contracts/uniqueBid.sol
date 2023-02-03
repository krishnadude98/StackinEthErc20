// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract uniqueBid {
    mapping(uint8 => address[]) bids;
    struct Data {
        address user;
        bool isbided;
        uint8 choice;
    }
    mapping(address => Data) bidders;
    address[] users;
    uint8 private offset;
    uint8 public lowerRange = 0;
    uint8 public upperRange = 10;
    bool public gameEnded = false;
    address public owner;
    address public winner;

    constructor(uint8 _offset) {
        owner = msg.sender;
        offset = _offset;
    }

    function setRange(uint8 lower, uint8 upper) public onlyOwner isGameEnded {
        lowerRange = lower;
        upperRange = upper;
    }

    function stopGame() public onlyOwner isGameEnded {
        gameEnded = true;
    }

    function makeBid(uint8 _bid) public alreadyBided isGameEnded {
        uint8 actualbid = _bid - offset;
        require(
            actualbid >= lowerRange && actualbid <= upperRange,
            "Bid not in range"
        );
        bids[actualbid].push(msg.sender);
        bidders[msg.sender].isbided = true;
        bidders[msg.sender].choice = _bid;
        bidders[msg.sender].user = msg.sender;
        users.push(msg.sender);
    }

    function getBids() public view returns (Data[] memory) {
        require(gameEnded == true, "Time has not yet come");
        Data[] memory userlist = new Data[](users.length);
        for (uint8 i = 0; i < users.length; i++) {
            userlist[i] = bidders[users[i]];
        }
        return userlist;
    }

    function pickWinner() public onlyOwner returns (address) {
        require(gameEnded == true, "Time has not yet come");
        for (uint8 i = lowerRange; i <= upperRange; i++) {
            if (bids[i].length == 1) {
                winner = bids[i][0];
                return bids[i][0];
            }
        }
        revert("No unique bid");
    }

    function bidStatus(address account) public view returns (bool) {
        return bidders[account].isbided;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not Authorized");
        _;
    }
    modifier isGameEnded() {
        require(gameEnded == false, "Sorry the game is ended!!!");
        _;
    }
    modifier alreadyBided() {
        require(bidders[msg.sender].isbided == false, "No more chance macha");
        _;
    }
}

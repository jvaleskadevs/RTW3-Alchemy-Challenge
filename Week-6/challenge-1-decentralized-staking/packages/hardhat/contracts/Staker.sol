// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "hardhat/console.sol";
import "./ExampleExternalContract.sol";

contract Staker {

  ExampleExternalContract public exampleExternalContract;
  
  address public owner;
  
  mapping(address => uint256) public balances;
  mapping(address => uint256) public depositTimestamps;
  mapping(address => uint256) public depositBlockNumbers;
  
  uint256 public constant rewardRatePerSecond = 0.01 ether;
  uint256 public withdrawalDeadline = block.timestamp + 120 seconds;
  uint256 public claimDeadline = block.timestamp + 240 seconds;
  uint256 public currentBlock = 0;
  
  
  event Stake(address indexed sender, uint256 amount);
  event Received(address, uint);
  event Execute(address indexed sender, uint256 amount);

  constructor(address exampleExternalContractAddress) {
      exampleExternalContract = ExampleExternalContract(exampleExternalContractAddress);
  }
  
  // Stake function for a user to stake ETH in our contract
  
  function stake() public payable withdrawalDeadlineReached(false) claimDeadlineReached(false) {
  	balances[msg.sender] = balances[msg.sender] + msg.value;
  	depositTimestamps[msg.sender] = block.timestamp;
  	depositBlockNumbers[msg.sender] = block.number;
  	owner = msg.sender;
  	emit Stake(msg.sender, msg.value);
  }
  
  /*
  	Withdraw function for a user to remove their staked ETH inclusive
  	of both the principle balance and any accrued interest
  */
  
  function withdraw() public withdrawalDeadlineReached(true) claimDeadlineReached(false) notCompleted {
  	require(balances[msg.sender] > 0, "You have no balance to withdraw");
  	uint256 individualBalance = balances[msg.sender];
  	uint256 totalBlocks = block.number - depositBlockNumbers[msg.sender];
  	uint256 indBalanceRewards = individualBalance + ((block.timestamp - depositTimestamps[msg.sender]) * rewardRatePerSecond * (2 ** totalBlocks));
  	balances[msg.sender] = 0;
  	
  	// Transfer all ETH via call! (not transfer) cc: https://solidity-by-example.org/sending-ether
  	(bool sent, bytes memory data) = msg.sender.call{value: indBalanceRewards}("");
  	require(sent, "Withdrawal failed :( ");
  }
  
   /*
  	Allows any user to repatriate "unproductive" funds that are left in the staking contract
  	past the defined withdrawal period
  */
  
  function execute() public claimDeadlineReached(true) notCompleted {
  	uint256 contractBalance = address(this).balance;
  	exampleExternalContract.complete{value: address(this).balance}();
  }
  
  function recoverFunds() public claimDeadlineReached(true) /* completed */ onlyOwner {
  	exampleExternalContract.toStaker();
  	_resetTimers();
  }
  
  
  function withdrawalTimeLeft() public view returns (uint256 withdrawalTimeLeft) {
  	if (block.timestamp >= withdrawalDeadline) {
  		return (0);
  	} else {
  		return (withdrawalDeadline - block.timestamp);
  	}
  }
  
  function claimTimeLeft() public view returns (uint256 claimTimeLeft) {
  	if (block.timestamp >= claimDeadline) {
  		return (0);
  	} else {
  		return (claimDeadline - block.timestamp);
  	}
  }
  
  function _resetTimers() private {
  	withdrawalDeadline = block.timestamp + 120 seconds;
  	claimDeadline = block.timestamp + 240 seconds;
  	delete(depositTimestamps[msg.sender]);
  	delete(depositBlockNumbers[msg.sender]);
  } 
  
  modifier withdrawalDeadlineReached(bool requireReached) {
  	uint256 timeRemaining = withdrawalTimeLeft();
  	if (requireReached) {
  		require(timeRemaining == 0, "Withdrawal period is not reached yet");
  	} else {
  		require(timeRemaining > 0, "Withdrawal period has been reached");
  	}
  	_;
  }
  
  modifier claimDeadlineReached(bool requireReached) {
  	uint256 timeRemaining = claimTimeLeft();
  	if (requireReached) {
  		require(timeRemaining == 0, "Claim deadline is not reached yet");
  	} else {
  		require(timeRemaining > 0, "Claim deadline has been reached");
  	}
  	_;
  }
  
  modifier notCompleted() {
  	bool completed = exampleExternalContract.completed();
  	require(!completed, "Stake already completed");
  	_;
  }
  
  modifier onlyOwner() {
  	require(owner == msg.sender, "Forbidden, you are not the owner");
  	_;
  }
  
  /*
  	Time to "kill-time" on our local testnet
  */
  function killTime() public {
    currentBlock = block.timestamp;
  }
  
  /*
  	Function for our smart contract to receive ETH
  	cc: https://docs.soliditylang.org/en/latest/contracts.html#receive-ether-function
  */
  receive() external payable {
      emit Received(msg.sender, msg.value);
  }
}

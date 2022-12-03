// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
	This is a casino betting system implementation using 
	the commit/reveal method to get random values
**/

contract Casino {
	
	// Store info about a proposal bet by sideA
	struct ProposedBet {
		address sideA; 		// address proposing the bet
		uint value;			// bet amount in Wei
		uint placedAt;		// bet proposal timestamp
		bool accepted;		// whether proposal has been accepted or not
	}
	
	// Store info about an accepted bet by sideB
	struct AcceptedBet {
		address sideB;		// address accepting the bet proposal 
		uint acceptedAt;	// bet accepted timestamp
		uint randomB;		// a random value sent by sideB
	}
	
	// Store bet proposals by commitment value
	mapping(uint => ProposedBet) public proposedBets;
	// Store accepted bets by commitment value
	mapping(uint => AcceptedBet) public acceptedBets;
	
	// Event emitted after a sideA bet proposal has been filled successfully
	event BetProposed(
		uint indexed _commitment,
		uint value
	);
	
	// Event emitted to request sideA to send the randomA number
	event BetAccepted(
		uint indexed _commitment,
		address indexed _sideA
	);
	
	// Event emitted after a bet has been settled successfully
	event BetSettled(
		uint indexed _commitment,
		address winner,
		address loser,
		uint value		
	);
	
	
	// Called by sideA to start the process
	function proposeBet(uint _commitment) external payable {
		require(proposedBets[_commitment].value == 0,
			"Commitment already fullfiled");
		require(msg.value > 0, 
			"Bet amount must not be zero");
		// Add ProposedBet to proposedBets mapping 
		proposedBets[_commitment].sideA = msg.sender;
		proposedBets[_commitment].value = msg.value;
		proposedBets[_commitment].placedAt = block.timestamp;
		// accepted value is false by default
		emit BetProposed(_commitment, msg.value);
	}
	
	// Called by sideB to continue
	function acceptBet(uint _commitment, uint _random) external payable {
		require(!proposedBets[_commitment].accepted,
			"Bet already accepted");
		require(proposedBets[_commitment].sideA != address(0), 
			"Nobody made that bet");
		require(proposedBets[_commitment].value == msg.value,
			"Need to bet the same amount as sideA");
		
		acceptedBets[_commitment].sideB = msg.sender;
		acceptedBets[_commitment].acceptedAt = block.timestamp;
		acceptedBets[_commitment].randomB = _random;
		
		proposedBets[_commitment].accepted = true;
		
		emit BetAccepted(_commitment, proposedBets[_commitment].sideA);
	}
	
	// Called by sideA to reveal the randomA number and settle the bet
	function reveal(uint _random) external {
		uint _commitment = uint256(keccak256(abi.encodePacked(_random)));
		address payable _sideA = payable(msg.sender);
		address payable _sideB = payable(acceptedBets[_commitment].sideB);
		uint _agreedRandom = _random ^ acceptedBets[_commitment].randomB;
		uint _value = proposedBets[_commitment].value;
		
		require(proposedBets[_commitment].sideA == msg.sender,
			"Forbidden, it is not your bet");
		require(proposedBets[_commitment].accepted,
			"Bet has not been accepted yet");
			
		// Choose a winner, pay and emit an event
		if (_agreedRandom % 2 == 0) {
			// sideA wins
			_sideA.transfer(2*_value);
			emit BetSettled(_commitment, _sideA, _sideB, _value);
		} else {
			// sideB wins
			_sideB.transfer(2*_value);
			emit BetSettled(_commitment, _sideB, _sideA, _value);			
		}
		
		delete proposedBets[_commitment];
		delete acceptedBets[_commitment];
	}
}

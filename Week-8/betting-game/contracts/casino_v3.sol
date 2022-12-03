// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

/**
	This is a casino betting system implementation using 
	the commit/reveal method to get random values
**/

contract CasinoV3 {

	// If one side did not call reveal before it, the other side will win
	uint revealDeadline = 180 seconds;
	
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
		uint hashB;			// hash for a random number sent by sideB
	}
	
	// Store info about a revealed bet
	struct RevealedBet {
		uint randomA;
		uint randomB;
		bool revealedA;
		bool revealedB;
	}
	
	// Store bet proposals by commitment value
	mapping(uint => ProposedBet) public proposedBets;
	// Store accepted bets by commitment value
	mapping(uint => AcceptedBet) public acceptedBets;
	// Store revealed bets by commitment value
	mapping(uint => RevealedBet) public revealedBets;
	
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
	function acceptBet(uint _commitment, uint _hashB) external payable {
		require(!proposedBets[_commitment].accepted,
			"Bet already accepted");
		require(proposedBets[_commitment].sideA != address(0), 
			"Nobody made that bet");
		require(proposedBets[_commitment].value == msg.value,
			"Need to bet the same amount as sideA");
		
		acceptedBets[_commitment].sideB = msg.sender;
		acceptedBets[_commitment].acceptedAt = block.timestamp;
		acceptedBets[_commitment].hashB = _hashB;
		
		proposedBets[_commitment].accepted = true;
		
		emit BetAccepted(_commitment, proposedBets[_commitment].sideA);
	}
	
	
	// Called by side A to reveal his/her random number	
	function revealSideA(uint _commitment, uint _random) external {
		require(proposedBets[_commitment].accepted,
			"Bet has not been accepted yet");
		require(!revealedBets[_commitment].revealedA,
			"This number has already been revealed");
		uint _hash = uint256(keccak256(abi.encodePacked(_random)));
		require(_hash == _commitment, 
			"Wrong value");
		require(proposedBets[_commitment].sideA == msg.sender,
			"Forbidden, it is not your bet");
		revealedBets[_commitment].randomA = _random;
		revealedBets[_commitment].revealedA = true;
		
		// Check if bot sides revealed their random numbers
		if (revealedBets[_commitment].revealedA && revealedBets[_commitment].revealedB) {
			// Both sides revealed their random numbers
			settleBet(_commitment);			
		}
	}
	
	// Called by side B to reveal his/her random number	
	function revealSideB(uint _commitment, uint _random) external {
		require(proposedBets[_commitment].accepted,
			"Bet has not been accepted yet");
		require(!revealedBets[_commitment].revealedB,
			"This number has already been revealed");
		uint _hash = uint256(keccak256(abi.encodePacked(_random)));
		require(_hash == acceptedBets[_commitment].hashB, 
			"Wrong value");
		require(acceptedBets[_commitment].sideB == msg.sender,
			"Forbidden, it is not your bet");
		revealedBets[_commitment].randomB = _random;
		revealedBets[_commitment].revealedB = true;
		
		// Check if bot sides revealed their random numbers
		if (revealedBets[_commitment].revealedA && revealedBets[_commitment].revealedB) {
			// Both sides revealed their random numbers
			settleBet(_commitment);			
		}
	}
	
	// Helper function to call whenever both sides revealed their random numbers
	function settleBet(uint _commitment) private {
		// Get the random value from XOR between randomA and randomB
		uint _agreedRandom = revealedBets[_commitment].randomA ^ revealedBets[_commitment].randomB;
		uint _value = proposedBets[_commitment].value;
		address payable _sideA = payable(proposedBets[_commitment].sideA);
		address payable _sideB = payable(acceptedBets[_commitment].sideB);
		
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
		delete revealedBets[_commitment];		
	}

	// Preventing no reveal behaviour allowing a side to claim the prize
	// if the other side did not call reveal after a deadline
	function claimPrize(uint _commitment) external {
		require(revealDeadline < block.timestamp - acceptedBets[_commitment].acceptedAt,
			"Deadline is not ended");
		require(
			proposedBets[_commitment].sideA == msg.sender ||
			acceptedBets[_commitment].sideB == msg.sender,
			"Forbidden, it is not your bet");

		// Check if it is sideA or sideB
		if (proposedBets[_commitment].sideA == msg.sender) {
			// It is sideA
			require(!revealedBets[_commitment].revealedB, 
				"The other side revealed in time");
			uint _value = proposedBets[_commitment].value;
			address payable _sideA = payable(msg.sender);
			_sideA.transfer(2*_value);
			emit BetSettled(_commitment, _sideA, acceptedBets[_commitment].sideB, _value);
		} else {
			// It is sideB
			require(!revealedBets[_commitment].revealedA,
				"The other side revealed in time");
			uint _value = proposedBets[_commitment].value;
			address payable _sideB = payable(msg.sender);
			_sideB.transfer(2*_value);
			emit BetSettled(_commitment, _sideB, proposedBets[_commitment].sideA, _value);
		}

		delete proposedBets[_commitment];
		delete acceptedBets[_commitment];
		delete revealedBets[_commitment];		
	}
}

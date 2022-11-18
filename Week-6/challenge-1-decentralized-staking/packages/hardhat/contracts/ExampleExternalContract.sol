// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;  //Do not change the solidity version as it negativly impacts submission grading

import "./Staker.sol";

contract ExampleExternalContract {

  bool public completed;

  function complete() public payable {
    completed = true;
  }
  
  function toStaker() public {
  	if (completed) {
  		payable(msg.sender).transfer(address(this).balance);
  		completed = false;
  	}
  }

}

const { ethers } = require("hardhat")

const value = ethers.utils.keccak256(0xBAD060A8)
const hash = ethers.utils.keccak256(value)


console.log("Value A");
console.log(value);
console.log("Hash A");
console.log(hash);


const valueB = ethers.utils.keccak256(0x32562FB)
const hashB = ethers.utils.keccak256(valueB)

console.log("Value B");
console.log(valueB);
console.log("Hash B");
console.log(hashB);

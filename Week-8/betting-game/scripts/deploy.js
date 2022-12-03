async function main() {
	const [deployer] = await ethers.getSigners();
	console.log("Deploying contracts with the account:", deployer.address);
	console.log("Account balance:", (await deployer.getBalance()).toString());
	
	const factory = await ethers.getContractFactory("CasinoV3");
	const contract = await factory.deploy();
	
	console.log("Contract deployed to:", contract.address);
}

main()
	.then(() => {
		process.exit(0);
	})
	.catch((err) => {
		console.log(err);
		process.exit(1);	
	});

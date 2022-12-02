import Navbar from "./Navbar";
import axie from "../tile.jpeg";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import { Network, Alchemy } from 'alchemy-sdk';
import { useEffect } from 'react';

export default function NFTPage (props) {

	const alchemySettings = {
		apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
		network: Network.ETH_GOERLI
	};
	
	const alchemy = new Alchemy(alchemySettings);

	const [alchemyData, updateAlchemyData] = useState({});
	const [alchemyDataFetched, updateAlchemyDataFetched] = useState(false);
	const [data, updateData] = useState({});
	const [dataFetched, updateDataFetched] = useState(false);
	const [message, updateMessage] = useState("");
	const [currAddress, updateCurrAddress] = useState("0x");
	const [listingPrice, updateListingPrice] = useState(0);


	async function getAlchemyNFTData(contract, tokenId) {
		const ethers = require("ethers");
		const provider = new ethers.providers.Web3Provider(window.ethereum);
		const signer = provider.getSigner();
		const addr = await signer.getAddress();
		
		let nft = await alchemy.nft.getNftMetadata(
			contract,
			tokenId
		);
		
		console.log(nft);
		
		let item = {
			tokenId: tokenId,
			name: nft.title,
			image: nft.rawMetadata.image,
			description: nft.description,
			seller: "Not listed",
			price: "Not listed",
			owner: addr,
			contract: contract,
			tokenURI: nft.tokenUri.raw
		}
		
		console.log(item);
		
		updateAlchemyDataFetched(true);
		updateAlchemyData(item);
		updateData(item);
		updateDataFetched(true);
		updateCurrAddress(addr);
	}

	async function getNFTData(tokenId) {
		const ethers = require("ethers");
		//After adding your Hardhat network to your metamask, this code will get providers and signers
		const provider = new ethers.providers.Web3Provider(window.ethereum);
		const signer = provider.getSigner();
		const addr = await signer.getAddress();
		//Pull the deployed contract instance
		let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
		//create an NFT Token
		const tokenURI = await contract.tokenURI(tokenId);
		const listedToken = await contract.getListedTokenForId(tokenId);
		let meta = await axios.get(tokenURI);
		meta = meta.data;
		console.log(listedToken);

		let item = {
		    price: ethers.utils.formatEther(listedToken.price),
		    tokenId: tokenId,
		    seller: listedToken.seller,
		    owner: listedToken.owner,
		    image: meta.image,
		    name: meta.name,
		    description: meta.description,
		    currentlyListed: listedToken.currentlyListed
		}
		console.log(item);
		updateData(item);
		updateDataFetched(true);
		console.log("address", addr)
		updateCurrAddress(addr);
	}

	async function buyNFT(tokenId) {
		try {
		    const ethers = require("ethers");
		    //After adding your Hardhat network to your metamask, this code will get providers and signers
		    const provider = new ethers.providers.Web3Provider(window.ethereum);
		    const signer = provider.getSigner();

		    //Pull the deployed contract instance
		    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
		    const salePrice = ethers.utils.parseUnits(data.price, 'ether')
		    updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")
		    //run the executeSale function
		    let transaction = await contract.executeSale(tokenId, {value:salePrice});
		    await transaction.wait();

		    alert('You successfully bought the NFT!');
		    updateMessage("");
		    updateDataFetched(false);
		}
		catch(e) {
		    alert("Upload Error"+e)
		}
	}
	
	async function listNFT(tokenId) {
		if (listingPrice <= 0) return;
		try {
			const ethers = require("ethers");
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();
			
			let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
			const listPrice = ethers.utils.parseUnits(listingPrice, 'ether')
			updateMessage("Listing the NFT... Please Wait (Upto 5 mins)")
			
			let listingFee = await contract.getListPrice()
			
			//console.log(tokenURI);
			console.log(listPrice);
			
			let transaction = await contract.listToken(tokenId, listPrice, {value: listingFee.toString()});
			await transaction.wait();
			
			alert('You successfully listed the NFT!');
			updateMessage("");
			updateDataFetched(false);
			
		} catch(err) {
			console.log(err);
		}
	}
	

    const params = useParams();
    const contract = params.contract;
    const tokenId = params.tokenId;
    
    useEffect(() => {
    	if (dataFetched == true) return;
		if (contract === 'undefined' || contract === MarketplaceJSON.address) {
			getNFTData(tokenId);
		} else {
			getAlchemyNFTData(contract, tokenId);
		}   
    }, [dataFetched])
       

    return(
        <div style={{"minHeight":"100vh"}}>
            <Navbar></Navbar>
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5" />
                <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
                    <div>
                        Name: {data.name}
                    </div>
                    <div>
                        Description: {data.description}
                    </div>
                    <div>
                        Owner: <span className="text-sm">{data.owner}</span>
                    </div>
                    <div>
                        Seller: <span className="text-sm">{data.seller}</span>
                    </div>
                    <div>
                    	Contract: <span className="text-sm">{contract}</span>
                    </div>
                    <div>
                    	Creator fee: <span className="text-sm">10%</span>
                    </div>
                    <div>
                    { currAddress == data.owner || currAddress == data.seller ?
                    	<div>
                    	   {data.currentlyListed ?
				           <div  className="mb-6">
			           		  Price: 
			           		 <span className="">{" "+data.price + " ETH"}</span>
			           	   </div> 
			           	   : contract === 'undefined' || contract === MarketplaceJSON.address ?
			           	   <>
							<div className="mb-6">
								<label>Price (in ETH)</label>
								<input 
									className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
									type="number"
									placeholder="Min 0.01 ETH"
									step="0.01"
									value={listingPrice}
									onChange={e => updateListingPrice(e.target.value)}></input>
							</div>
							
                    		<button 
                    			className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                    			onClick={() => listNFT(tokenId)}
                    		>
                    			List this NFT
                			</button>
                			</> : null }
                    			<div className="text-emerald-700 mt-6">You are the owner of this NFT</div>
                    	</div>
                    	 :
                    	 <div>
				            <div  className="mb-6">
			           			Price: <span className="">{data.price + " ETH"}</span>
			           	    </div>
                        	<button 
                        		className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                        		onClick={() => buyNFT(tokenId)}
                    		>
                    			Buy this NFT
                			</button>
                       </div>
                    }
                    
                    <div className="text-green text-center mt-3">{message}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

import Navbar from "./Navbar";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import NFTTile from "./NFTTile";
import { Network, Alchemy } from 'alchemy-sdk';

export default function Profile () {
	const alchemySettings = {
		apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
		network: Network.ETH_GOERLI
	};
	
	const alchemy = new Alchemy(alchemySettings);

	const [alchemyData, updateAlchemyData] = useState([]);
    const [data, updateData] = useState([]);
    const [address, updateAddress] = useState("0x");
    const [totalPrice, updateTotalPrice] = useState("0");
    
    const [alchemyDataFetched, updateAlchemyDataFetched] = useState(false);
    const [dataFetched, updateFetched] = useState(false);
    
    async function getAlchemyData() {
    	const ethers = require("ethers");
    	const provider = new ethers.providers.Web3Provider(window.ethereum);
    	const signer = provider.getSigner();
    	const addr = await signer.getAddress();
    	
    	const nftsForOwner = await alchemy.nft.getNftsForOwner(addr);
    	console.log(nftsForOwner);
    	
    	const items = await Promise.all(nftsForOwner.ownedNfts.map(async i => {
    		/*
    		let meta = await alchemy.nft.getNftMetadata(
    			i.contract.address,
    			i.tokenId
    		);
    		*/
    		
    		
    		let item = {
    			tokenId: i.tokenId,
    			owner: addr,
    			image: i.rawMetadata.image,
    			name: i.title,
    			description: i.description,
    			contract: i.contract.address,
    			tokenURI: i.tokenUri.raw
    		}
    		
    		return item;
    	}))
    	
    	console.log(items);
    	
    	updateAlchemyData(items.filter(item => item.image));
    	updateAlchemyDataFetched(true);
    }

    async function getNFTsData() {
        const ethers = require("ethers");
        let sumPrice = 0;

        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)

        //create an NFT Token
        let transaction = await contract.getMyNFTs()

        /*
        * Below function takes the metadata from tokenURI and the data returned by getMyNFTs() contract function
        * and creates an object of information that is to be displayed
        */
        
        const items = await Promise.all(transaction.map(async i => {
            const tokenURI = await contract.tokenURI(i.tokenId);
            let meta = await axios.get(tokenURI);
            meta = meta.data;

            let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                creator: i.creator,
                image: meta.image,
                name: meta.name,
                description: meta.description,
                contract: MarketplaceJSON.address
            }
            sumPrice += Number(price);
            return item;
        }))

        updateData(items);
        updateFetched(true);
        updateAddress(addr);
        updateTotalPrice(sumPrice.toPrecision(3));
    }

    const params = useParams();
    const tokenId = params.tokenId;
    if(!dataFetched)
        getNFTsData();
        
    if (!alchemyDataFetched) getAlchemyData();
    
    return (
        <div className="profileClass" style={{"minHeight":"100vh"}}>
            <Navbar></Navbar>
            <div className="profileClass">
            <div className="flex text-center flex-col mt-11 md:text-2xl text-white">
                <div className="mb-5">
                    <h2 className="font-bold">Wallet Address</h2>  
                    {address}
                </div>
            </div>
            <div className="flex flex-row text-center justify-center mt-10 md:text-2xl text-white">
                    <div>
                        <h2 className="font-bold">No. of NFTs</h2>
                        {data.length}
                    </div>
                    <div className="ml-20">
                        <h2 className="font-bold">Total Value</h2>
                        {totalPrice} ETH
                    </div>
            </div>
            <div className="flex flex-col text-center items-center mt-11 text-white">
                <h2 className="font-bold">Your NFTs (Marketplace)</h2>
                <div className="flex justify-center flex-wrap max-w-screen-xl">
                    {data.map((value, index) => {
                    return <NFTTile data={value} key={index}></NFTTile>;
                    })}
                </div>
                <div className="mt-10 text-xl">
                    {data.length == 0 ? "Oops, No NFT data to display (Are you logged in?)":""}
                </div>
            </div>
            <div className="flex flex-col text-center items-center mt-11 text-white">
                <h2 className="font-bold">Your NFTs (External)</h2>
                <div className="flex justify-center flex-wrap max-w-screen-xl">
                    {alchemyData.map((value, index) => {
                    return <NFTTile data={value} key={index}></NFTTile>;
                    })}
                </div>
                <div className="mt-10 text-xl">
                    {alchemyData.length == 0 ? "Oops, No NFT data to display (Are you logged in?)":""}
                </div>
            </div>
            </div>
        </div>
    )
};

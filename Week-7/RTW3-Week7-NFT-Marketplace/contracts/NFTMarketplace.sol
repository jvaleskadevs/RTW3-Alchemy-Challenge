//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

//Console functions to help debug the smart contract just like in Javascript
import "hardhat/console.sol";
//OpenZeppelin's NFT Standard Contracts. We will extend functions from this in our implementation
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract NFTMarketplace is ERC721URIStorage {

	using Counters for Counters.Counter;
	// _tokenIds variable to store the last minted tokenId
	Counters.Counter private _tokenIds;
	// Keeps track of the total number of items sold in the marketplace
	Counters.Counter private _itemsSold;
	// The contract's owner, this address will receive the fees
	address payable owner;
	// The fee charged by the marketplace to be allowed to list an NFT
	uint256 listPrice = 0.01 ether;
	// The fee charged by the creator when an NFT created by him/her gets sold
	uint256 creatorFeeBase = 10; // 10%
	
	// Info about a listed token
	struct ListedToken {
		uint256 tokenId;
		address payable owner;
		address payable seller;
		address payable creator;
		uint256 price;
		bool currentlyListed;
	}
	
	// Event emitted after successfully list a token
	event TokenListedSuccess(
		uint256 indexed tokenId,
		address owner,
		address seller,
		address creator,
		uint256 price,
		bool currentlyListed
	);
	
	// A map between the tokenId and the stored listedToken info
	mapping(uint256 => ListedToken) private idToListedToken;
	
	
	constructor() ERC721("NFTMarketplace", "NFTM") {
		owner = payable(msg.sender);
	}

	// Create and list a new token
	function createToken(string memory tokenURI, uint256 price) public payable returns (uint) {
		// Increment the tokenId counter to track new tokens
		_tokenIds.increment();
		uint256 newTokenId = _tokenIds.current();
		
		// Mint the NFT to the address calling the function
		_safeMint(msg.sender, newTokenId);
		
		// Map the tokenId to the tokenURI
		_setTokenURI(newTokenId, tokenURI);
		
		// Helper function to update variables and emit an event
		createListedToken(newTokenId, price);
		
		return newTokenId;
	}
	
	// Helper function to update variables and emit an event
	function createListedToken(uint256 tokenId, uint256 price) private {
		// Make sure the user sent enough ETH to pay for listing
		require(msg.value == listPrice, "Please, send the right fee amount");
		// Sanity check
		require(price > 0, "Price cannot be negative");
		
		// Update the mapping
		idToListedToken[tokenId] = ListedToken(
			tokenId,
			payable(address(this)),
			payable(msg.sender),
			payable(msg.sender),
			price,
			true
		);
		
		// Transfer the minted NFT to the contract to be listed
		_transfer(msg.sender, address(this), tokenId);
		// Emit and event for successful listing
		emit TokenListedSuccess(
			tokenId,
			address(this),
			msg.sender,
			msg.sender,
			price,
			true
		);
	}
	
	// This will allow to list an NFT previously minted by the contract
	function listToken(uint256 tokenId, uint256 price) public payable {
		// Make sure the user is the owner of the NFT he/she want to list
		require(idToListedToken[tokenId].owner == payable(msg.sender),
			"Forbidden, you are not the NFT owner");
		// Make sure the user sent enough ETH to pay for listing
		require(msg.value == listPrice, "Please, send the right fee amount");
		// Sanity check
		require(price > 0, "Price cannot be negative");
		
		// Update the mapping
		idToListedToken[tokenId].owner = payable(address(this));
		idToListedToken[tokenId].seller = payable(msg.sender);
		idToListedToken[tokenId].price = price;
		idToListedToken[tokenId].currentlyListed = true;
		
		// Transfer the NFT to the contract to be listed
		_transfer(msg.sender, address(this), tokenId);
		// Emit and event for successful listing
		emit TokenListedSuccess(
			tokenId,
			address(this),
			msg.sender,
			idToListedToken[tokenId].creator,
			price,
			true
		);
	}
	
	// This will allow to update the price of listed NFTs
	function updateListedTokenPrice(uint256 tokenId, uint256 price) public payable {
		// Make sure the user is the seller of the NFT he/she want to update
		require(idToListedToken[tokenId].seller == payable(msg.sender),
			"Forbidden, you are not the NFT owner");
		require(idToListedToken[tokenId].owner == payable(address(this)),
			"Forbidden, NFT is not listed");		
		// Sanity check
		require(price > 0, "Price cannot be negative");
		
		// Update the mapping
		idToListedToken[tokenId].price = price;
		
		// Emit and event for successful listing
		emit TokenListedSuccess(
			tokenId,
			address(this),
			msg.sender,
			idToListedToken[tokenId].creator,
			price,
			true
		);
	}
	
	// This will return all the NFTs on the marketplace
	function getAllNFTs() public view returns (ListedToken[] memory) {
		uint nftCount = _tokenIds.current();
		ListedToken[] memory tokens = new ListedToken[](nftCount);
		uint currentIndex = 0;
		
		for(uint i = 0; i < nftCount; i++) {
			uint currentId = i + 1;
			ListedToken storage currentItem = idToListedToken[currentId];
			tokens[currentIndex] = currentItem;
			currentIndex += 1;
		}
		// the array 'tokens' has the list of all nfts in the marketplace
		return tokens;
	}
	
	// This will return all the NFTs currently listed to be sold on the marketplace
	function getListedNFTs() public view returns (ListedToken[] memory) {
		uint nftCount = _tokenIds.current();
		uint listedCount = 0;
		
		for (uint i = 0; i < nftCount; i++) {
			if (idToListedToken[i+1].currentlyListed == true) {
				listedCount += 1;
			} 
		}
		
		ListedToken[] memory tokens = new ListedToken[](listedCount);
		uint currentIndex = 0;
		
		for(uint i = 0; i < nftCount; i++) {
			uint currentId = i + 1;
			ListedToken storage currentItem = idToListedToken[currentId];
			if (currentItem.currentlyListed == true) {
				tokens[currentIndex] = currentItem;
			}
			currentIndex += 1;
		}
		// the array 'tokens' has the list of all nfts listed in the marketplace
		return tokens;
	}	

    // Returns all the NFTs that the current user is owner or seller in
    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;
        
        // Get a count of all the NFTs owned by the user to make an array for them
        for(uint i=0; i < totalItemCount; i++)
        {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender){
                itemCount += 1;
            }
        }

        // Create an array to store all the NFTs in it
        ListedToken[] memory items = new ListedToken[](itemCount);
        for(uint i=0; i < totalItemCount; i++) {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender) {
                uint currentId = i+1;
                ListedToken storage currentItem = idToListedToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
    
    // Function called when a user clicks the "Buy NFT" button
    function executeSale(uint256 tokenId) public payable {
    	uint price = idToListedToken[tokenId].price;
    	address seller = idToListedToken[tokenId].seller;
    	address creator = idToListedToken[tokenId].creator;
    	uint creatorFee = creatorFeeBase * msg.value / 100;
    	require(msg.value == price, "Submit the right price to buy!");
    	
    	// Update token details
    	idToListedToken[tokenId].currentlyListed = false;
    	idToListedToken[tokenId].seller = payable(msg.sender);
    	idToListedToken[tokenId].owner = payable(msg.sender);
    	_itemsSold.increment();
    	
    	//Actually transfer the token to the new owner
    	_transfer(address(this), msg.sender, tokenId);
    	//approve the marketplace to sell NFTs on your behalf
    	approve(address(this), tokenId);
    	
    	//Transfer the listing fee to the marketplace creator
    	payable(owner).transfer(listPrice);
    	// Transfer the creator fee to the creator
    	payable(creator).transfer(creatorFee);
    	//Transfer the remaining proceeds from the sale to the seller of the NFT
    	payable(seller).transfer(msg.value - creatorFee);
    }
	
	// Helper functions
	
	function updateListPrice(uint256 _listPrice) public payable {
        require(owner == msg.sender, "Only owner can update listing price");
        listPrice = _listPrice;
    }

    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    function getLatestIdToListedToken() public view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }

    function getListedTokenForId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }
}

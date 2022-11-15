import { useState } from 'react'
import { NFTCard } from "./components/nftCard"
// React Component to manage pagination in a modern way using a pull down system to load more elements
import InfiniteScroll from "react-infinite-scroll-component";

const Home = () => {

	const [wallet, setWallet] = useState("");
	const [collection, setCollection] = useState("");
	const [NFTs, setNFTs] = useState([]);
	const [fetchForCollection, setFetchForCollection] = useState(false)
	const [fetchedForCollection, setFetchedForCollection] = useState(false)
	const [pageKey, setPageKey] = useState("");
	const [isFirst, setIsFirst] = useState(true);
	
	const fetchNFTs = async() => {
		let nfts; 
		console.log("fetching nfts");
		const alchemy_url = process.env.ALCHEMY_URL
		const api_key = process.env.ALCHEMY_KEY
		const baseURL = `${alchemy_url}/${api_key}/getNFTs/`;
		var requestOptions = {
		    method: 'GET'
		  };
		 
		if (!collection.length) {
			let fetchURL;
			if (pageKey !== "") {
				fetchURL = `${baseURL}?owner=${wallet}&pageKey=${pageKey}`;
			} else {
				fetchURL = `${baseURL}?owner=${wallet}`;
			}
		  nfts = await fetch(fetchURL, requestOptions).then(data => data.json())
		} else {
		  console.log("fetching nfts for collection owned by address")
		  let fetchURL;
		  if (pageKey !== "") {
		  	fetchURL = `${baseURL}?owner=${wallet}&contractAddresses%5B%5D=${collection}&pageKey=${pageKey}`;
		  } else {
		  	fetchURL = `${baseURL}?owner=${wallet}&contractAddresses%5B%5D=${collection}`;
		  }
		  nfts = await fetch(fetchURL, requestOptions).then(data => data.json())
		}

		if (nfts) {
		  console.log("nfts:", nfts)
		  if (isFirst) {
		  	setNFTs(nfts.ownedNfts)
		  } else {
		  	setNFTs([...NFTs, ...nfts.ownedNfts])
		  }
		  
	    
	    if (nfts.pageKey) {
	    	setPageKey(nfts.pageKey)
	    	setIsFirst(false)
	    } else {
	    	setPageKey("")
	    }
	    setFetchedForCollection(false)
		}
	}
	
	const fetchNFTsForCollection = async () => {
		if (collection.length) {
		  var requestOptions = {
		    method: 'GET'
		  };
		  const alchemy_url = process.env.ALCHEMY_URL
		  const api_key = process.env.ALCHEMY_KEY
		  const baseURL = `${alchemy_url}/${api_key}/getNFTsForCollection/`;
		  
		  let fetchURL; 
		  if (pageKey !== "") {
		  	fetchURL = `${baseURL}?contractAddress=${collection}&withMetadata=${"true"}&startToken=${pageKey}`;
		  } else { 
		  	fetchURL = `${baseURL}?contractAddress=${collection}&withMetadata=${"true"}`;
		  }
		  
		  const nfts = await fetch(fetchURL, requestOptions).then(data => data.json())
		  
		  if (nfts) {
		    console.log("NFTs in collection:", nfts)
		    
		    if (isFirst) {
		    	setNFTs(nfts.nfts)
		    } else {
		    	setNFTs([...NFTs, ...nfts.nfts])
		    }
		    
		    if (nfts.nextToken) {
			  	setPageKey(nfts.nextToken)
			  	setIsFirst(false)
		    } else {
		    	setPageKey("")
		    }
		    setFetchedForCollection(true)
		  }
		}
	}
	
	const onClickLetsGo = () => {
		if (fetchForCollection) {
			fetchNFTsForCollection()
		} else {
			fetchNFTs()
		}		
	}
 
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-y-3">
      <div className="flex flex-col w-full justify-center items-center gap-y-2">
        <input
        	disabled={fetchForCollection}
        	onChange={(e)=>{setWallet(e.target.value)}} 
        	value={wallet}
        	type={"text"} 
        	placeholder="Add your wallet address">
      	</input>
        <input
        	onChange={(e)=>{setCollection(e.target.value)}} 
        	value={collection} 
        	type={"text"} 
        	placeholder="Add the collection address">
      	</input>
      	<label className="text-gray-600 ">
      		<input 
      			onChange={(e)=>{setFetchForCollection(e.target.checked)}}
      			type={"checkbox"} 
      			className="mr-2">
    			</input>
      		Fetch for collection
    		</label>
    		<button 
    			className={"disabled:bg-slate-500 text-white bg-violet-500 px-4 py-2 mt-3 rounded-sm w-1/5"}
    			onClick={() => { 
    					setIsFirst(true)
					onClickLetsGo()
    				}
  			}
  			>
    			Let's go! 
  			</button>
      </div>

{/*      
      <div className='flex flex-wrap gap-y-12 mt-4 w-5/6 gap-x-2 justify-center'>
        {
          NFTs.length && NFTs.map(nft => {
            return (
              <NFTCard nft={nft}></NFTCard>
            )
          })
        }
      </div>
*/}
      
	    <InfiniteScroll
	    	dataLength={NFTs.length}
	    	next={fetchedForCollection ? fetchNFTsForCollection : fetchNFTs}
	    	hasMore={pageKey !== ""}
	    	loader={<h4>Loading more NFTs...</h4>}
	    	className='flex flex-wrap gap-y-12 mt-4 w-5/6 gap-x-2 justify-center'
	    >
	     {
		    NFTs.length && NFTs.map((nft, index) => {
		      return (
		        <NFTCard nft={nft} key={index}></NFTCard>
		      )
		    })
			 }  	
	    </InfiniteScroll>

      
    </div>
  )
}

export default Home

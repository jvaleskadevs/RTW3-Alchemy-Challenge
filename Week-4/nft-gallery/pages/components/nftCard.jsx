import { FaCopy } from 'react-icons/fa'

const NFTCard = ({ nft }) => {

    return (
        <div className="w-1/4 flex flex-col ">
        <div className="rounded-md">
            <img className="object-cover h-128 w-full rounded-t-md" src={nft.media[0].gateway} ></img>
        </div>
        <div className="flex flex-col y-gap-2 px-2 py-3 bg-slate-100 rounded-b-md h-110 ">
            <div className="">
                <h2 className="text-xl text-gray-800">{nft.title}</h2>
                <div className="flex flex-row">
                   <p className="text-gray-600">{`Id: ${nft.id.tokenId.slice(0, 4)}...${nft.id.tokenId.slice(-4)}`}</p>
                   <button 
                   	className="mx-2 text-violet-500 hover:text-violet-600 active:text-violet-700" 
                   	onClick={() => {navigator.clipboard.writeText(nft.id.tokenId)}}>
                   	<FaCopy />
                   </button>      
                </div>
                <div className="flex flex-row">
                	<p className="text-gray-600" >{`Contract address: ${nft.contract.address.slice(0, 4)}...${nft.contract.address.slice(-4)}`}</p>
                   <button 
                   	className="mx-2 mx-2 text-violet-500 hover:text-violet-600 active:text-violet-700"
                   	onClick={() => {navigator.clipboard.writeText(nft.contract.address)}}
                   >
                   	<FaCopy />
                   </button>      
                </div>
            </div>

            <div className="flex-grow mt-2">
                <p className="text-gray-600">{nft.description}</p>
            </div>
        </div>

    </div>
    )
}

export default NFTCard;

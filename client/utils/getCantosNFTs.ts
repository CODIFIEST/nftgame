import axios from "axios";
import { BigNumber, ethers, Signer } from "ethers";
import NFT_ABI from "./NFT_ABI";
import { NFTType } from "../../server/domain/nft"
import type { NFT } from "../../server/domain/nft"

export default async function fetchCantos(signer: Signer): Promise<NFT[]> {
    console.log("getting contract")
    const chainID = await signer.getChainId();
    console.log('chainid', chainID)
    const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_URL, NFT_ABI, signer);
    
    console.log('contract', contract)
    const walletaddress = await signer.getAddress();
    console.log('walletaddress',walletaddress)
    const tokenIds = await contract.walletOfOwner(walletaddress);
    
    console.log('tokenids', tokenIds)
    return await Promise.all(
        (tokenIds || []).map(async (tokenId: BigNumber) => {
            const uri = await contract.tokenURI(tokenId);
            console.log('uri', uri)
            const md = await axios.get(uri);
            console.log('md', md)
            const nft: NFT = {
                imageURL: md.data.image,
                title: "#" + md.data.edition,
                nftType: NFTType.Canto,
                description: "cantos motherfucker",
                collecctionAddress: tokenId.toString(),
                tokenAddress: "put the token address here"
            };
            return nft;
        }))
}
import { NFTType, type NFT } from "../../server/domain/nft";
// not currently supported by solanaJS
import axios from "axios";
// import  dotenv from "dotenv"
// dotenv.config();
// dotenv.config({ path: `../../.env`} )
// require('dotenv').config()
// declare var process : {
//     env: {
//       VITE_QUICKNODE_APK: string
//     }
//   }
let i = 1;
const domainNFTs: NFT[] = [];
async function getSolNFTs(address: string): Promise<NFT[]> {

    const config = {
        headers: {
            "Content-Type": "application/json",
        },
    };

    let data = {
        jsonrpc: "2.0",
        id: 1,
        method: "qn_fetchNFTs",
        params: {
            wallet: address,
            omitFields: ["provenance", "traits"],
            page: i,
            perPage: 40,
        },
    };

    let quiknodeNFTs = await axios.post(import.meta.env.VITE_QUICKNODE_APK, data, config)
    // let solNFTs = quiknodeNFTs.data.result;
    while (quiknodeNFTs.data.result.totalPages >= quiknodeNFTs.data.result.pageNumber) {

        console.log(quiknodeNFTs)
        quiknodeNFTs.data.result.assets.forEach(nft => {
            if (nft.collectionName === 'NGMIPandas') {
                const eachNFT: NFT = {
                    title: nft.name,
                    description: nft.description,
                    imageURL: nft.imageUrl,
                    collecctionAddress: nft.collecctionAddress,
                    tokenAddress: nft.tokenAddress,
                    nftType: NFTType.Solana
                }
                domainNFTs.push(eachNFT)
            }
        });

        console.log('do we get inside the while loop?')
        console.log('total pages', quiknodeNFTs.data.result.totalPages)
        console.log('this page', quiknodeNFTs.data.result.pageNumber)
        i++;
        data = {
            jsonrpc: "2.0",
            id: 1,
            method: "qn_fetchNFTs",
            params: {
                wallet: address,
                omitFields: ["provenance", "traits"],
                page: i,
                perPage: 40,
            },
        };
        quiknodeNFTs = await axios.post(import.meta.env.VITE_QUICKNODE_APK, data, config)

    }
    console.log(domainNFTs)
    return domainNFTs;

};


export default getSolNFTs
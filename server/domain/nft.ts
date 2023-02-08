enum NFTType{
    Ethereum,
    IMX,
    Solana,
    Loopring,
    Canto
}
type NFT ={
    title:string,
    description:string,
    imageURL:string,
    collecctionAddress:string,
    tokenAddress:string,
    nftType:NFTType
}

export type  { NFT } 
export {NFTType}
import { ethers } from "ethers";
import { signer} from "../src/stores/signer"
import fetchCantos from "./getCantosNFTs"
import nfts from "../src/stores/nfts";
import type { NFT } from "../../server/domain/nft";
import { get } from "svelte/store";
type EthereumWindow = {
    ethereum: any;
};

async function connectMetamask(){
  const provider = new ethers.providers.Web3Provider((window as any as EthereumWindow).ethereum);

  const account = await provider.send("eth_requestAccounts", []);
  console.log('acccount', account)
   
    const localsigner = provider.getSigner();
    signer.set(localsigner);
    
    const cantoNFTs:NFT[] = await fetchCantos(localsigner);
    nfts.set(cantoNFTs);
    console.log('localsigner',localsigner);
    console.log('cantos nfts');
    console.log(cantoNFTs);
    const test = get(nfts)
    console.log(test)
};
export default connectMetamask;

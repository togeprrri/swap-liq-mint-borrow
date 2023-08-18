import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

import MintABI from './abi/Mint.json' assert { type: 'json' };

document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("changeToGoerli").addEventListener("click", changeToGoerli);
document.getElementById("changeToZkSync").addEventListener("click", changeToZkSync);
document.getElementById("mint").addEventListener("click", main);

let provider;
let signer;

const NFTAddress = "0x616383a01180a5267ec3736657a759e7a7de27ce";

async function connectWallet() {
    await window.ethereum.enable();
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
}

async function changeToGoerli() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: "0x5" }],
        });
        console.log("You have switched to the right network")

    } catch (switchError) {
        if (switchError.code === 4902) {
            window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: "0x5",
                    rpcUrls: ["https://goerli.infura.io/v3/"],
                    chainName: "Goerli",
                    nativeCurrency: {
                        symbol: "GETH",
                        decimals: 18
                    },
                }]
            });
        }
        else {
            console.log(switchError)
        }
    }

}

async function changeToZkSync() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: "0x118" }],
        });
        console.log("You have switched to the right network")

    } catch (switchError) {
        if (switchError.code === 4902) {
            window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: "0x118",
                    rpcUrls: ["https://testnet.era.zksync.dev"],
                    chainName: "zkSync Era Testnet",
                    nativeCurrency: {
                        symbol: "ETH",
                        decimals: 18
                    },
                }]
            });
        }
        else {
            console.log(switchError)
        }
    }
}


async function mint() {
    const NFTContract = new ethers.Contract(
        NFTAddress,
        MintABI,
        signer
    );

    await NFTContract.mint({ value: ethers.parseEther("0.00023") });
}

async function main() {
    await mint();
}
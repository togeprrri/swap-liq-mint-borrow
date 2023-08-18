import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("borrow").addEventListener("click", main);

let provider;
let signer;

const Comptroller = "0xf8980a63F091ABddB0F1a5Fd298443d8f49eB59a";

const abi = [
    "function enterMarkets(address[] cTokens) returns (uint256[])",
    "function borrowAllowed(address cToken,address borrower,uint256 borrowAmount) returns (uint256)"]

async function connectWallet() {
    await window.ethereum.enable();
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
}


async function borrow(token, amount) {
    const Contract = new ethers.Contract(
        Comptroller,
        abi,
        signer
    );

    await Contract.enterMarkets([token]);
    //await Contract.borrowAllowed(token, signer.address, amount);
}

async function main() {
    const tokenAddress = document.getElementById('borrowToken').value;
    const amount = ethers.parseEther(document.getElementById('borrowAmount').value);

    await borrow(tokenAddress, amount);
}
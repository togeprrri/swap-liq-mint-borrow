import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

import RouterABI from './abi/MuteRouter.json' assert { type: 'json' };
import FactoryABI from './abi/MuteFactory.json' assert { type: 'json' };
import ERC20ABI from './abi/ERC20.json' assert { type: 'json' };

document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("createLiq").addEventListener("click", main);

let provider;
let signer;

const WETH = "0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91";
const Factory = "0x40be1cba6c5b47cdf9da7f963b6f761f4c60627d";
const Router = "0x8B791913eB07C32779a16750e3868aA8495F5964";

async function connectWallet() {
    await window.ethereum.enable();
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    console.log("Connected wallet.")
}


async function addLiquidity(tokenA, tokenB, amountA, amountB) {
    const factory = new ethers.Contract(
        Factory,
        FactoryABI,
        provider
    );

    const pairAddress = await factory.getPair(tokenA, tokenB, false);
    console.log(pairAddress);
    if (pairAddress != ethers.ZeroAddress) {
        console.log('Pair exists');
    }
    else {
        const response = await factory.createPair(tokenA, tokenB, 30, false/*, {gasLimit: 500_000}*/);
        await response.wait();
        console.log("Pair created");
    }

    if (tokenA == WETH) {
        const tokenBContract = new ethers.Contract(tokenB, ERC20ABI, signer);
        amountA = ethers.parseEther(amountA);
        amountB = ethers.parseUnits(amountB, await tokenBContract.decimals());
        const approved = await tokenBContract.allowance(signer.address, Router);
        if(approved < amountB){
            const responseB = await tokenBContract.approve(Router, await tokenBContract.balanceOf(signer.address));
            await provider.waitForTransaction(responseB.hash);
        }
        
    }
    else if(tokenB == WETH) {
        const tokenAContract = new ethers.Contract(tokenA, ERC20ABI, signer);
        amountB = ethers.parseEther(amountB);
        amountA = ethers.parseUnits(amountA, await tokenAContract.decimals());
        const approved = await tokenAContract.allowance(signer.address, Router);
        if(approved < amountA){
            const responseB = await tokenAContract.approve(Router, await tokenAContract.balanceOf(signer.address));
            await provider.waitForTransaction(responseB.hash);
        }
    }


    const router = new ethers.Contract(
        Router,
        RouterABI,
        signer
    )

    if (tokenA == WETH || tokenB == WETH) {
        console.log("Adding ETH Liq");
        console.log(tokenA, tokenB);
        const { token, amount, price } = tokenA == WETH ? { token: tokenB, amount: amountB, price: amountA } : { token: tokenA, amount: amountA, price: amountB };
        console.log(token, amount, price);
        const response = await router.addLiquidityETH(
            token,
            amount,
            1,
            1,
            signer.address,
            BigInt(Math.floor(Date.now() / 1000)) + 1800n,
            30,
            false,
            {
                value: price,
                //gasLimit: 500_000
            }
        );
        //console.log(response);
        await provider.waitForTransaction(response.hash);
    }
    else {
        console.log("Adding Liq");
        const response = await router.addLiquidity(
            tokenA,
            tokenB,
            amountA,
            amountB,
            1,
            1,
            signer.address,
            BigInt(Math.floor(Date.now() / 1000)) + 1800n,
            0,
            false
        );
        await response.wait();
    }


}

async function main() {
    const tokenAAddress = document.getElementById('liqTokenIn').value;
    const tokenBAddress = document.getElementById('liqTokenOut').value;
    const amountA = document.getElementById('liqAmountIn').value;
    const amountB = document.getElementById('liqAmountOut').value;

    await addLiquidity(
        tokenAAddress == WETH || tokenAAddress == ethers.ZeroAddress ? WETH : tokenAAddress,
        tokenBAddress == WETH || tokenBAddress == ethers.ZeroAddress ? WETH : tokenBAddress,
        amountA,
        amountB
    );
}
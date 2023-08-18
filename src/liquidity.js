import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

import RouterABI from './abi/MuteRouter.json' assert { type: 'json' };
import FactoryABI from './abi/MuteFactory.json' assert { type: 'json' };
import ERC20ABI from './abi/ERC20.json' assert { type: 'json' };

document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("createLiq").addEventListener("click", main);

let provider;
let signer;

const WETH = "0x294cB514815CAEd9557e6bAA2947d6Cf0733f014";
const Factory = "0xCc05E242b4A82f813a895111bCa072c8BBbA4a0e";
const Router = "0x96c2Cf9edbEA24ce659EfBC9a6e3942b7895b5e8";

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

    const tokenAContract = new ethers.Contract(tokenA, ERC20ABI, signer);
    const tokenBContract = new ethers.Contract(tokenB, ERC20ABI, signer);
    const responseA = await tokenAContract.approve(Router, await tokenAContract.balanceOf(signer.address));
    const responseB = await tokenBContract.approve(Router, await tokenBContract.balanceOf(signer.address));
    await provider.waitForTransaction(responseA.hash);
    await provider.waitForTransaction(responseB.hash);


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
    const amountA = ethers.parseEther(document.getElementById('liqAmountIn').value);
    const amountB = ethers.parseEther(document.getElementById('liqAmountOut').value);

    await addLiquidity(
        tokenAAddress == WETH || tokenAAddress == ethers.ZeroAddress ? WETH : tokenAAddress,
        tokenBAddress == WETH || tokenBAddress == ethers.ZeroAddress ? WETH : tokenBAddress,
        amountA,
        amountB
    );
}
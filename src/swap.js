import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

import BasePoolFactoryABI from './abi/BasePoolFactory.json' assert { type: 'json' };
import RouterABI from './abi/Router.json' assert { type: 'json' };
import ERC20ABI from './abi/ERC20.json' assert { type: 'json' };

document.getElementById("connectWallet").addEventListener("click", connectWallet);
document.getElementById("swap").addEventListener("click", main);

let provider;
let signer;

await window.ethereum.enable();
provider = new ethers.BrowserProvider(window.ethereum);
signer = await provider.getSigner();

const WETH = "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91";
const ClassicPoolFactory = "0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb";
const Router = "0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295";

async function connectWallet() {
    await window.ethereum.enable();
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: "0x144" }],
        });
        console.log("You have switched to the right network")

    } catch (switchError) {
        if (switchError.code === 4902) {
            window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: "0x144",
                    rpcUrls: ["https://mainnet.era.zksync.io"],
                    chainName: "zkSync Era Mainnet",
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

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
}


async function swap(tokenIn, tokenOut, amountIn, amountOutMin, signer) {
    const classicPoolFactory = new ethers.Contract(
        ClassicPoolFactory,
        BasePoolFactoryABI,
        provider
    );

    const poolAddress = await classicPoolFactory.getPool(tokenIn, tokenOut);
    console.log(poolAddress);

    if (poolAddress === ethers.ZeroAddress) {
        throw Error('Pool not exists');
    }

    const withdrawMode = 1;

    const swapData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint8"],
        [tokenIn, signer.address, withdrawMode],
    );

    const steps = [{
        pool: poolAddress,
        data: swapData,
        callback: ethers.ZeroAddress,
        callbackData: '0x',
    }];

    const paths = [{
        steps,
        tokenIn: tokenIn == WETH ? ethers.ZeroAddress : tokenIn,
        amountIn,
    }];

    const router = new ethers.Contract(Router, RouterABI, signer);

    console.log(paths[0]);

    const response = await router.swap(
        paths,
        amountOutMin,
        BigInt(Math.floor(Date.now() / 1000)) + 1800n,
        {
            value: tokenIn == WETH ? amountIn : 0,
        }
    );
    console.log(response);
    console.log("Transaction: ", response.hash);
}

async function main() {
    const tokenInAddress = document.getElementById('swapTokenIn').value;
    const tokenOutAddress = document.getElementById('swapTokenOut').value;
    const amount = ethers.parseEther(document.getElementById('swapAmount').value);

    console.log(`Swapping ${amount} ${tokenInAddress} for ${tokenOutAddress}`);

    if (tokenInAddress == WETH || tokenInAddress == ethers.ZeroAddress) {
        console.log('here')
        const tokenOut = new ethers.Contract(tokenOutAddress, ERC20ABI, signer);

        console.log("BEFORE:");
        console.log(`In: ${await provider.getBalance(signer.address)}`);
        console.log(`Out: ${await tokenOut.balanceOf(signer.address)}`);

        await swap(WETH, tokenOutAddress, amount, 0, signer);

        console.log("AFTER:");
        console.log(`In: ${await provider.getBalance(signer.address)}`)
        console.log(`Out: ${await tokenOut.balanceOf(signer.address)}`);
    }
    else {
        const tokenIn = new ethers.Contract(tokenInAddress, ERC20ABI, signer);

        const allowance = await tokenIn.allowance(signer.address, Router);
        if (allowance < amount) {
            await tokenIn.approve(Router, await tokenIn.balanceOf(signer.address))
        }

        console.log("BEFORE:");
        console.log(`In: ${await tokenIn.balanceOf(signer.address)}`);
        console.log(`Out: ${await provider.getBalance(signer.address)}`);

        await swap(tokenInAddress, tokenOutAddress, amount, 0, signer);

        console.log("AFTER:");
        console.log(`In: ${await tokenIn.balanceOf(signer.address)}`);
        console.log(`Out: ${await provider.getBalance(signer.address)}`);
    }
}
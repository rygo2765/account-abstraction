import { ChainId, Percent, Token, TradeType } from "@uniswap/sdk-core";
import {
  AlphaRouter,
  CurrencyAmount,
  SwapOptionsSwapRouter02,
  SwapRoute,
  SwapType,
} from "@uniswap/smart-order-router";
import { fromReadableAmount } from "../test/helpers/conversion";
import { USDC_TOKEN, WETH_TOKEN } from "../test/helpers/token";

import { providers } from "ethers5";
import { ethers } from "hardhat";
import wethAbi from "./helpers/weth.json";
import erc20Abi from "../test/helpers/erc20.abi.json";

async function getRoute(
  recipient: `0x${string}`,
  inToken: Token,
  outToken: Token,
  amount: number
) {
  const router = new AlphaRouter({
    chainId: ChainId.MAINNET,
    provider: new providers.JsonRpcProvider(process.env.MAINNET_RPC),
  });

  const options: SwapOptionsSwapRouter02 = {
    recipient,
    slippageTolerance: new Percent(50, 10_000),
    deadline: Math.floor(Date.now() / 1000 + 1800),
    type: SwapType.SWAP_ROUTER_02,
  };

  const route = await router.route(
    CurrencyAmount.fromRawAmount(
      inToken,
      fromReadableAmount(amount, inToken.decimals).toString()
    ),
    outToken,
    TradeType.EXACT_INPUT,
    options
  );

  return route;
}

async function main() {
  // @ts-ignore
  const [user] = await ethers.getSigners();

  const inToken = WETH_TOKEN;
  const inAmount = 1;
  const outToken = USDC_TOKEN;

  const outTokenContract = new ethers.Contract(
    outToken.address,
    erc20Abi,
    user
  );
  const outBalanceBefore = await outTokenContract.balanceOf(user.address);
  console.log({ outBalanceBefore });

  if (inToken.address === WETH_TOKEN.address) {
    const weth = new ethers.Contract(WETH_TOKEN.address, wethAbi, user);
    await weth.deposit({ value: ethers.parseEther(inAmount.toString()) });
  }
  const inTokenContract = new ethers.Contract(inToken.address, erc20Abi, user);

  await inTokenContract.approve(
    "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    fromReadableAmount(inAmount, inToken.decimals)
  );

  const route = await getRoute(user.address, inToken, outToken, inAmount);

  const txParams = {
    data: route?.methodParameters?.calldata,
    to: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
    value: route?.methodParameters?.value,
    from: user.address,
  };

  const res = await user.sendTransaction({
    ...txParams,
  });
  console.log(res);

  const outBalanceAfter = await outTokenContract.balanceOf(user.address);
  console.log({ outBalanceAfter });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

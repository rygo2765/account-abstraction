import { ChainId, Percent, Token, TradeType } from "@uniswap/sdk-core";
import {
  AlphaRouter,
  CurrencyAmount,
  SwapOptionsSwapRouter02,
  SwapType,
} from "@uniswap/smart-order-router";
import { fromReadableAmount } from "./conversion";
import { providers } from "ethers5";

export async function getRoute(
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

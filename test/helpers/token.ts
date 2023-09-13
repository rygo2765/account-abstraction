import { ChainId, Token } from "@uniswap/sdk-core";

export const WETH_TOKEN = new Token(
  ChainId.MAINNET,
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  18,
  "WETH",
  "Wrapped Ether"
);

export const LBR_TOKEN = new Token(
  ChainId.MAINNET,
  "0xed1167b6Dc64E8a366DB86F2E952A482D0981ebd",
  18,
  "LBR",
  "Lybra"
);

export const USDC_TOKEN = new Token(
  ChainId.MAINNET,
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  6,
  "USDC",
  "USD//C"
);

export const DAI_TOKEN = new Token(
  ChainId.MAINNET,
  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  18,
  "DAI",
  "Dai Stablecoin"
);

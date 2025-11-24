import { Contract, JsonRpcProvider, JsonRpcSigner, Provider } from "ethers";
import AMM_ABI from "./abi/AMM.json";
import MOCK_TOKEN_ABI from "./abi/MockToken.json";
import { publicClientToProvider, walletClientToSigner } from "@/config/adapter";

// Contract addresses - these should be set after deployment
// For now, we'll use environment variables or constants
export const AMM_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AMM_CONTRACT_ADDRESS || "";

export type PoolInfo = {
  token0: string;
  token1: string;
  reserve0: bigint;
  reserve1: bigint;
  feeBps: number;
  totalSupply: bigint;
};

export type PoolCreatedEvent = {
  poolId: string;
  token0: string;
  token1: string;
  feeBps: number;
  initialLiquidity: bigint;
  amount0: bigint;
  amount1: bigint;
  provider: string;
};

/**
 * Get an ethers Contract instance for the AMM
 */
export const getAMMContract = (
  address: string,
  signerOrProvider: JsonRpcSigner | Provider
): Contract => {
  return new Contract(address, AMM_ABI, signerOrProvider);
};

/**
 * Get an ethers Contract instance for an ERC20 token
 */
export const getTokenContract = (
  address: string,
  signerOrProvider: JsonRpcSigner | Provider
): Contract => {
  return new Contract(address, MOCK_TOKEN_ABI, signerOrProvider);
};

/**
 * Get pool information by poolId
 */
export const getPool = async (
  poolId: string,
  contractAddress: string,
  provider: Provider
): Promise<PoolInfo | null> => {
  try {
    const contract = getAMMContract(contractAddress, provider);
    const result = await contract.getPool(poolId);
    
    return {
      token0: result[0],
      token1: result[1],
      reserve0: BigInt(result[2].toString()),
      reserve1: BigInt(result[3].toString()),
      feeBps: Number(result[4]),
      totalSupply: BigInt(result[5].toString()),
    };
  } catch (error) {
    console.error("Error getting pool:", error);
    return null;
  }
};

/**
 * Get user's LP balance for a specific pool
 */
export const getUserLiquidity = async (
  poolId: string,
  userAddress: string,
  contractAddress: string,
  provider: Provider
): Promise<bigint> => {
  try {
    const contract = getAMMContract(contractAddress, provider);
    const balance = await contract.getLpBalance(poolId, userAddress);
    return BigInt(balance.toString());
  } catch (error) {
    console.error("Error getting user liquidity:", error);
    return BigInt(0);
  }
};

/**
 * Calculate pool ID from token addresses and fee
 */
export const getPoolId = async (
  tokenA: string,
  tokenB: string,
  feeBps: number,
  contractAddress: string,
  provider: Provider
): Promise<string> => {
  try {
    const contract = getAMMContract(contractAddress, provider);
    const poolId = await contract.getPoolId(tokenA, tokenB, feeBps);
    return poolId;
  } catch (error) {
    console.error("Error calculating pool ID:", error);
    throw error;
  }
};

/**
 * Get all pools by listening to PoolCreated events
 */
export const getAllPools = async (
  contractAddress: string,
  provider: Provider,
  fromBlock?: number
): Promise<PoolCreatedEvent[]> => {
  try {
    const contract = getAMMContract(contractAddress, provider);
    const filter = contract.filters.PoolCreated();
    const events = await contract.queryFilter(filter, fromBlock || 0);
    
    return events.map((event: any) => {
      const args = (event as any).args;
      return {
        poolId: args.poolId,
        token0: args.token0,
        token1: args.token1,
        feeBps: Number(args.feeBps),
        initialLiquidity: BigInt(args.initialLiquidity.toString()),
        amount0: BigInt(args.amount0.toString()),
        amount1: BigInt(args.amount1.toString()),
        provider: args.provider,
      };
    });
  } catch (error) {
    console.error("Error getting all pools:", error);
    return [];
  }
};

/**
 * Create a new pool
 */
export const createPool = async (
  tokenA: string,
  tokenB: string,
  amountA: bigint,
  amountB: bigint,
  contractAddress: string,
  signer: JsonRpcSigner
): Promise<{ poolId: string; liquidity: bigint; txHash: string }> => {
  try {
    const contract = getAMMContract(contractAddress, signer);
    
    // Approve tokens first
    const tokenAContract = getTokenContract(tokenA, signer);
    const tokenBContract = getTokenContract(tokenB, signer);
    
    await tokenAContract.approve(contractAddress, amountA);
    await tokenBContract.approve(contractAddress, amountB);
    
    // Create pool
    const tx = await contract.createPool(tokenA, tokenB, amountA, amountB);
    const receipt = await tx.wait();
    
    // Get pool ID from event
    const poolCreatedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "PoolCreated";
      } catch {
        return false;
      }
    });
    
    let poolId = "";
    let liquidity = BigInt(0);
    
    if (poolCreatedEvent) {
      const parsed = contract.interface.parseLog(poolCreatedEvent);
      if (parsed?.args) {
        poolId = parsed.args.poolId;
        liquidity = BigInt(parsed.args.initialLiquidity.toString());
      }
    }
    
    return {
      poolId,
      liquidity,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error("Error creating pool:", error);
    throw error;
  }
};

/**
 * Add liquidity to an existing pool
 */
export const addLiquidity = async (
  poolId: string,
  amount0Desired: bigint,
  amount1Desired: bigint,
  contractAddress: string,
  signer: JsonRpcSigner
): Promise<{ liquidity: bigint; amount0: bigint; amount1: bigint; txHash: string }> => {
  try {
    const contract = getAMMContract(contractAddress, signer);
    
    // Get pool info to know which tokens to approve
    const poolInfo = await contract.getPool(poolId);
    const token0 = poolInfo[0];
    const token1 = poolInfo[1];
    
    // Approve tokens
    const token0Contract = getTokenContract(token0, signer);
    const token1Contract = getTokenContract(token1, signer);
    
    await token0Contract.approve(contractAddress, amount0Desired);
    await token1Contract.approve(contractAddress, amount1Desired);
    
    // Add liquidity
    const tx = await contract.addLiquidity(poolId, amount0Desired, amount1Desired);
    const receipt = await tx.wait();
    
    // Get amounts from event
    const liquidityAddedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "LiquidityAdded";
      } catch {
        return false;
      }
    });
    
    let liquidity = BigInt(0);
    let amount0 = BigInt(0);
    let amount1 = BigInt(0);
    
    if (liquidityAddedEvent) {
      const parsed = contract.interface.parseLog(liquidityAddedEvent);
      if (parsed?.args) {
        liquidity = BigInt(parsed.args.liquidityMinted.toString());
        amount0 = BigInt(parsed.args.amount0.toString());
        amount1 = BigInt(parsed.args.amount1.toString());
      }
    }
    
    return {
      liquidity,
      amount0,
      amount1,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error("Error adding liquidity:", error);
    throw error;
  }
};

/**
 * Remove liquidity from a pool
 */
export const removeLiquidity = async (
  poolId: string,
  liquidity: bigint,
  contractAddress: string,
  signer: JsonRpcSigner
): Promise<{ amount0: bigint; amount1: bigint; txHash: string }> => {
  try {
    const contract = getAMMContract(contractAddress, signer);
    
    const tx = await contract.removeLiquidity(poolId, liquidity);
    const receipt = await tx.wait();
    
    // Get amounts from event
    const liquidityRemovedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "LiquidityRemoved";
      } catch {
        return false;
      }
    });
    
    let amount0 = BigInt(0);
    let amount1 = BigInt(0);
    
    if (liquidityRemovedEvent) {
      const parsed = contract.interface.parseLog(liquidityRemovedEvent);
      if (parsed?.args) {
        amount0 = BigInt(parsed.args.amount0.toString());
        amount1 = BigInt(parsed.args.amount1.toString());
      }
    }
    
    return {
      amount0,
      amount1,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error("Error removing liquidity:", error);
    throw error;
  }
};

/**
 * Execute a swap
 */
export const swap = async (
  poolId: string,
  tokenIn: string,
  amountIn: bigint,
  minAmountOut: bigint,
  recipient: string,
  contractAddress: string,
  signer: JsonRpcSigner
): Promise<{ amountOut: bigint; txHash: string }> => {
  try {
    const contract = getAMMContract(contractAddress, signer);
    
    // Approve token
    const tokenInContract = getTokenContract(tokenIn, signer);
    await tokenInContract.approve(contractAddress, amountIn);
    
    // Execute swap
    const tx = await contract.swap(poolId, tokenIn, amountIn, minAmountOut, recipient);
    const receipt = await tx.wait();
    
    // Get amount out from event
    const swapEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "Swap";
      } catch {
        return false;
      }
    });
    
    let amountOut = BigInt(0);
    
    if (swapEvent) {
      const parsed = contract.interface.parseLog(swapEvent);
      if (parsed?.args) {
        amountOut = BigInt(parsed.args.amountOut.toString());
      }
    }
    
    return {
      amountOut,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error("Error executing swap:", error);
    throw error;
  }
};
<<<<<<< HEAD
import { Contract, type JsonRpcSigner, type Provider } from "ethers";

export type Pool = {
  token0: string;
  token1: string;
  fee: number;
  pool: string;
  blockNumber?: number;
  txHash?: string;
};

// Minimal factory ABI: PoolCreated event + createPool function
const DEFAULT_FACTORY_ABI = [
  "event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, address pool)",
  "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address)",
];

// Minimal router ABI placeholders — callers may pass a custom ABI for their router
const DEFAULT_ROUTER_ABI = [
  "function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external returns (uint256)",
  "function addLiquidity(address pool, address tokenA, address tokenB, uint256 amountA, uint256 amountB) external returns (uint256 shares)",
  "function removeLiquidity(address pool, uint256 shares) external returns (uint256 amountA, uint256 amountB)",
];

/**
 * Read all PoolCreated events from a factory contract and return typed pools.
 * - `provider` may be an ethers Provider (read-only) or BrowserProvider from ethers.
 * - `factoryAbi` is optional — a minimal ABI is provided.
 */
export async function getAllPools(
  provider: Provider | any,
  factoryAddress: string,
  factoryAbi: any = DEFAULT_FACTORY_ABI,
): Promise<Pool[]> {
  const factory = new Contract(factoryAddress, factoryAbi, provider);
  const filter = factory.filters?.PoolCreated?.();
  const events = filter ? await factory.queryFilter(filter) : [];
  return events.map((ev: any) => ({
    token0: ev.args?.token0 ?? ev.args?.[0],
    token1: ev.args?.token1 ?? ev.args?.[1],
    fee: Number(ev.args?.fee ?? ev.args?.[2] ?? 0),
    pool: ev.args?.pool ?? ev.args?.[3],
    blockNumber: ev.blockNumber,
    txHash: ev.transactionHash,
  }));
}

/**
 * Create a pool using a factory contract. Returns the transaction receipt (wait result).
 * - `signer` must be an ethers Signer (JsonRpcSigner) connected to a wallet.
 * - `factoryAbi` can be supplied if the factory uses different function signatures.
 */
export async function createPool(
  signer: JsonRpcSigner,
  factoryAddress: string,
  tokenA: string,
  tokenB: string,
  fee: number,
  factoryAbi: any = DEFAULT_FACTORY_ABI,
) {
  const factory = new Contract(factoryAddress, factoryAbi, signer);
  const tx = await factory.createPool(tokenA, tokenB, fee);
  return tx.wait?.();
}

/**
 * Add liquidity via a router/manager contract. Returns transaction receipt.
 * - `routerAbi` defaults to a minimal shape; pass a real ABI for your router.
 */
export async function addLiquidity(
  signer: JsonRpcSigner,
  routerAddress: string,
  poolAddress: string,
  tokenA: string,
  tokenB: string,
  amountA: string | number,
  amountB: string | number,
  routerAbi: any = DEFAULT_ROUTER_ABI,
) {
  const router = new Contract(routerAddress, routerAbi, signer);
  const tx = await router.addLiquidity(poolAddress, tokenA, tokenB, amountA, amountB);
  return tx.wait?.();
}

/**
 * Remove liquidity from a pool (by shares). Returns transaction receipt and amounts.
 */
export async function removeLiquidity(
  signer: JsonRpcSigner,
  routerAddress: string,
  poolAddress: string,
  shares: string | number,
  routerAbi: any = DEFAULT_ROUTER_ABI,
) {
  const router = new Contract(routerAddress, routerAbi, signer);
  const tx = await router.removeLiquidity(poolAddress, shares);
  return tx.wait?.();
}

/**
 * Execute a swap via a router contract. Returns transaction receipt and any returned value.
 */
export async function swap(
  signer: JsonRpcSigner,
  routerAddress: string,
  tokenIn: string,
  tokenOut: string,
  amountIn: string | number,
  minAmountOut: string | number,
  routerAbi: any = DEFAULT_ROUTER_ABI,
) {
  const router = new Contract(routerAddress, routerAbi, signer);
  const tx = await router.swap(tokenIn, tokenOut, amountIn, minAmountOut);
  return tx.wait?.();
}

/**
 * Query a pool or position manager for a user's liquidity. This is intentionally
 * permissive: it will try a few common methods (`balanceOf`, `liquidityOf`, `positions`).
 */
export async function getUserLiquidity(
  provider: Provider | any,
  userAddress: string,
  poolAddress: string,
  poolAbi: any = [
    "function balanceOf(address owner) view returns (uint256)",
    "function liquidityOf(address owner) view returns (uint256)",
  ],
) {
  const pool = new Contract(poolAddress, poolAbi, provider);
  // try balanceOf
  try {
    const bal = await pool.balanceOf(userAddress);
    return { type: "balanceOf", amount: bal.toString() } as const;
  } catch (e) {
    // ignore and try next
  }
  try {
    const liq = await pool.liquidityOf(userAddress);
    return { type: "liquidityOf", amount: liq.toString() } as const;
  } catch (e) {
    // ignore
  }
  return { type: "unknown", amount: "0" } as const;
}

export default {
  getAllPools,
  createPool,
  addLiquidity,
  removeLiquidity,
  swap,
  getUserLiquidity,
};
=======
import { Contract, JsonRpcProvider, JsonRpcSigner, Provider } from "ethers";
import AMM_ABI from "./abi/AMM.json";
import MOCK_TOKEN_ABI from "./abi/MockToken.json";
import { publicClientToProvider, walletClientToSigner } from "@/config/adapter";

// Contract addresses - these should be set after deployment
// For now, we'll use environment variables or constants
export const AMM_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AMM_CONTRACT_ADDRESS || "";

export type PoolInfo = {
  token0: string;
  token1: string;
  reserve0: bigint;
  reserve1: bigint;
  feeBps: number;
  totalSupply: bigint;
};

export type PoolCreatedEvent = {
  poolId: string;
  token0: string;
  token1: string;
  feeBps: number;
  initialLiquidity: bigint;
  amount0: bigint;
  amount1: bigint;
  provider: string;
};

/**
 * Get an ethers Contract instance for the AMM
 */
export const getAMMContract = (
  address: string,
  signerOrProvider: JsonRpcSigner | Provider
): Contract => {
  return new Contract(address, AMM_ABI, signerOrProvider);
};

/**
 * Get an ethers Contract instance for an ERC20 token
 */
export const getTokenContract = (
  address: string,
  signerOrProvider: JsonRpcSigner | Provider
): Contract => {
  return new Contract(address, MOCK_TOKEN_ABI, signerOrProvider);
};

/**
 * Get pool information by poolId
 */
export const getPool = async (
  poolId: string,
  contractAddress: string,
  provider: Provider
): Promise<PoolInfo | null> => {
  try {
    const contract = getAMMContract(contractAddress, provider);
    const result = await contract.getPool(poolId);
    
    return {
      token0: result[0],
      token1: result[1],
      reserve0: BigInt(result[2].toString()),
      reserve1: BigInt(result[3].toString()),
      feeBps: Number(result[4]),
      totalSupply: BigInt(result[5].toString()),
    };
  } catch (error) {
    console.error("Error getting pool:", error);
    return null;
  }
};

/**
 * Get user's LP balance for a specific pool
 */
export const getUserLiquidity = async (
  poolId: string,
  userAddress: string,
  contractAddress: string,
  provider: Provider
): Promise<bigint> => {
  try {
    const contract = getAMMContract(contractAddress, provider);
    const balance = await contract.getLpBalance(poolId, userAddress);
    return BigInt(balance.toString());
  } catch (error) {
    console.error("Error getting user liquidity:", error);
    return BigInt(0);
  }
};

/**
 * Calculate pool ID from token addresses and fee
 */
export const getPoolId = async (
  tokenA: string,
  tokenB: string,
  feeBps: number,
  contractAddress: string,
  provider: Provider
): Promise<string> => {
  try {
    const contract = getAMMContract(contractAddress, provider);
    const poolId = await contract.getPoolId(tokenA, tokenB, feeBps);
    return poolId;
  } catch (error) {
    console.error("Error calculating pool ID:", error);
    throw error;
  }
};

/**
 * Get all pools by listening to PoolCreated events
 */
export const getAllPools = async (
  contractAddress: string,
  provider: Provider,
  fromBlock?: number
): Promise<PoolCreatedEvent[]> => {
  try {
    const contract = getAMMContract(contractAddress, provider);
    const filter = contract.filters.PoolCreated();
    const events = await contract.queryFilter(filter, fromBlock || 0);
    
    return events.map((event: any) => {
      const args = (event as any).args;
      return {
        poolId: args.poolId,
        token0: args.token0,
        token1: args.token1,
        feeBps: Number(args.feeBps),
        initialLiquidity: BigInt(args.initialLiquidity.toString()),
        amount0: BigInt(args.amount0.toString()),
        amount1: BigInt(args.amount1.toString()),
        provider: args.provider,
      };
    });
  } catch (error) {
    console.error("Error getting all pools:", error);
    return [];
  }
};

/**
 * Create a new pool
 */
export const createPool = async (
  tokenA: string,
  tokenB: string,
  amountA: bigint,
  amountB: bigint,
  contractAddress: string,
  signer: JsonRpcSigner
): Promise<{ poolId: string; liquidity: bigint; txHash: string }> => {
  try {
    const contract = getAMMContract(contractAddress, signer);
    
    // Approve tokens first
    const tokenAContract = getTokenContract(tokenA, signer);
    const tokenBContract = getTokenContract(tokenB, signer);
    
    await tokenAContract.approve(contractAddress, amountA);
    await tokenBContract.approve(contractAddress, amountB);
    
    // Create pool
    const tx = await contract.createPool(tokenA, tokenB, amountA, amountB);
    const receipt = await tx.wait();
    
    // Get pool ID from event
    const poolCreatedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "PoolCreated";
      } catch {
        return false;
      }
    });
    
    let poolId = "";
    let liquidity = BigInt(0);
    
    if (poolCreatedEvent) {
      const parsed = contract.interface.parseLog(poolCreatedEvent);
      if (parsed?.args) {
        poolId = parsed.args.poolId;
        liquidity = BigInt(parsed.args.initialLiquidity.toString());
      }
    }
    
    return {
      poolId,
      liquidity,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error("Error creating pool:", error);
    throw error;
  }
};

/**
 * Add liquidity to an existing pool
 */
export const addLiquidity = async (
  poolId: string,
  amount0Desired: bigint,
  amount1Desired: bigint,
  contractAddress: string,
  signer: JsonRpcSigner
): Promise<{ liquidity: bigint; amount0: bigint; amount1: bigint; txHash: string }> => {
  try {
    const contract = getAMMContract(contractAddress, signer);
    
    // Get pool info to know which tokens to approve
    const poolInfo = await contract.getPool(poolId);
    const token0 = poolInfo[0];
    const token1 = poolInfo[1];
    
    // Approve tokens
    const token0Contract = getTokenContract(token0, signer);
    const token1Contract = getTokenContract(token1, signer);
    
    await token0Contract.approve(contractAddress, amount0Desired);
    await token1Contract.approve(contractAddress, amount1Desired);
    
    // Add liquidity
    const tx = await contract.addLiquidity(poolId, amount0Desired, amount1Desired);
    const receipt = await tx.wait();
    
    // Get amounts from event
    const liquidityAddedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "LiquidityAdded";
      } catch {
        return false;
      }
    });
    
    let liquidity = BigInt(0);
    let amount0 = BigInt(0);
    let amount1 = BigInt(0);
    
    if (liquidityAddedEvent) {
      const parsed = contract.interface.parseLog(liquidityAddedEvent);
      if (parsed?.args) {
        liquidity = BigInt(parsed.args.liquidityMinted.toString());
        amount0 = BigInt(parsed.args.amount0.toString());
        amount1 = BigInt(parsed.args.amount1.toString());
      }
    }
    
    return {
      liquidity,
      amount0,
      amount1,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error("Error adding liquidity:", error);
    throw error;
  }
};

/**
 * Remove liquidity from a pool
 */
export const removeLiquidity = async (
  poolId: string,
  liquidity: bigint,
  contractAddress: string,
  signer: JsonRpcSigner
): Promise<{ amount0: bigint; amount1: bigint; txHash: string }> => {
  try {
    const contract = getAMMContract(contractAddress, signer);
    
    const tx = await contract.removeLiquidity(poolId, liquidity);
    const receipt = await tx.wait();
    
    // Get amounts from event
    const liquidityRemovedEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "LiquidityRemoved";
      } catch {
        return false;
      }
    });
    
    let amount0 = BigInt(0);
    let amount1 = BigInt(0);
    
    if (liquidityRemovedEvent) {
      const parsed = contract.interface.parseLog(liquidityRemovedEvent);
      if (parsed?.args) {
        amount0 = BigInt(parsed.args.amount0.toString());
        amount1 = BigInt(parsed.args.amount1.toString());
      }
    }
    
    return {
      amount0,
      amount1,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error("Error removing liquidity:", error);
    throw error;
  }
};

/**
 * Execute a swap
 */
export const swap = async (
  poolId: string,
  tokenIn: string,
  amountIn: bigint,
  minAmountOut: bigint,
  recipient: string,
  contractAddress: string,
  signer: JsonRpcSigner
): Promise<{ amountOut: bigint; txHash: string }> => {
  try {
    const contract = getAMMContract(contractAddress, signer);
    
    // Approve token
    const tokenInContract = getTokenContract(tokenIn, signer);
    await tokenInContract.approve(contractAddress, amountIn);
    
    // Execute swap
    const tx = await contract.swap(poolId, tokenIn, amountIn, minAmountOut, recipient);
    const receipt = await tx.wait();
    
    // Get amount out from event
    const swapEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "Swap";
      } catch {
        return false;
      }
    });
    
    let amountOut = BigInt(0);
    
    if (swapEvent) {
      const parsed = contract.interface.parseLog(swapEvent);
      if (parsed?.args) {
        amountOut = BigInt(parsed.args.amountOut.toString());
      }
    }
    
    return {
      amountOut,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error("Error executing swap:", error);
    throw error;
  }
};


>>>>>>> 6e3d04c6002a19b5ad38ba1783edd9b491916baa

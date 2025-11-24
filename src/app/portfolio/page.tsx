"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import { formatUnits } from "ethers";

import { shortenAddress } from "@/lib/utils";
import { networks } from "@/config/wagmi";
import { getAllPools, getPool, getUserLiquidity, AMM_CONTRACT_ADDRESS, type PoolInfo, type PoolCreatedEvent } from "@/lib/amm";
import { publicClientToProvider } from "@/config/adapter";

type Position = {
  poolId: string;
  pair: string;
  network: number;
  feeTier: string;
  value: string;
  share: string;
  lpBalance: bigint;
  poolInfo: PoolInfo;
};

const rewards = [
  { title: "Protocol incentives", amount: "$0", description: "Accrued over the last distribution epoch." },
  { title: "Pending LP fees", amount: "$0", description: "Collect to compound or withdraw to base currency." },
  { title: "Aggregator rebates", amount: "$0", description: "Captured from flow routed through Quantum Router." },
];

export default function PortfolioPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [netLiquidity, setNetLiquidity] = useState(0);

  const activeNetwork = useMemo(
    () => (chainId ? networks.find((item) => item.id === chainId) : undefined),
    [chainId],
  );

  // Fetch user positions
  useEffect(() => {
    const fetchPositions = async () => {
      if (!isConnected || !address || !publicClient || !AMM_CONTRACT_ADDRESS) {
        setPositions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const provider = publicClientToProvider(publicClient);
        if (!provider) {
          setError("Provider not available");
          setLoading(false);
          return;
        }

        // Get all pools
        const poolEvents = await getAllPools(AMM_CONTRACT_ADDRESS, provider);
        
        // For each pool, check user's LP balance
        const userPositions: Position[] = [];
        let totalLiquidity = 0;

        for (const event of poolEvents) {
          const userLpBalance = await getUserLiquidity(event.poolId, address, AMM_CONTRACT_ADDRESS, provider);
          
          if (userLpBalance > BigInt(0)) {
            const poolInfo = await getPool(event.poolId, AMM_CONTRACT_ADDRESS, provider);
            if (poolInfo) {
              // Calculate user's share
              const share = poolInfo.totalSupply > BigInt(0)
                ? (Number(userLpBalance) / Number(poolInfo.totalSupply)) * 100
                : 0;

              // Calculate position value (simplified - assumes 1:1 token value)
              const reserve0Value = Number(formatUnits(poolInfo.reserve0, 18));
              const reserve1Value = Number(formatUnits(poolInfo.reserve1, 18));
              const positionValue = (reserve0Value + reserve1Value) * (share / 100);
              totalLiquidity += positionValue;

              const feeTier = `${(event.feeBps / 100).toFixed(2)}%`;

              userPositions.push({
                poolId: event.poolId,
                pair: `${shortenAddress(event.token0, 4)} / ${shortenAddress(event.token1, 4)}`,
                network: chainId || 1,
                feeTier,
                value: `$${positionValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                share: `${share.toFixed(2)}%`,
                lpBalance: userLpBalance,
                poolInfo,
              });
            }
          }
        }

        setPositions(userPositions);
        setNetLiquidity(totalLiquidity);
      } catch (err) {
        console.error("Error fetching positions:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch positions");
        setPositions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
  }, [isConnected, address, publicClient, chainId]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-14">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Portfolio</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Monitor liquidity positions, fees, and rewards across all supported networks.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">
            Wallet: {isConnected && address ? shortenAddress(address, 5) : "—"}
          </span>
          <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">
            Active Network: {activeNetwork?.name ?? "—"}
          </span>
          <span className="rounded-full border border-zinc-200 px-3 py-1 dark:border-zinc-700">
            Strategy: Market Making
          </span>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">Net Liquidity</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {loading ? "..." : isConnected ? `$${netLiquidity.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
          </p>
          <p className="mt-1 text-xs text-emerald-500">
            {isConnected ? `${positions.length} position${positions.length !== 1 ? 's' : ''}` : "Connect to view"}
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">Unclaimed Fees</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{isConnected ? "$0" : "—"}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {isConnected ? "Collect to claim and restake" : "Connect wallet to fetch"}
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">APR (Weighted)</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{isConnected ? "—" : "—"}</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Across {positions.length} position{positions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">Risk Controls</p>
          <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Healthy</p>
          <p className="mt-1 text-xs text-emerald-500">No deviation alerts</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Positions</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Concentrated liquidity ranges, fee accruals, and health indicators.
              </p>
            </div>
            <Link
              href="/pools"
              className="rounded-full border border-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
            >
              Add liquidity
            </Link>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70">
            <table className="min-w-full divide-y divide-zinc-200/70 text-sm dark:divide-zinc-800/70">
              <thead className="bg-zinc-50/80 dark:bg-zinc-900/70">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <th className="px-4 py-3">Pool</th>
                  <th className="px-4 py-3">Fee Tier</th>
                  <th className="px-4 py-3">LP Balance</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Share</th>
                  <th className="px-4 py-3">Reserves</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 bg-white/60 dark:divide-zinc-800/70 dark:bg-zinc-950/40">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      Loading positions...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-rose-500">
                      Error: {error}
                    </td>
                  </tr>
                ) : positions.length === 0 && isConnected ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      No liquidity positions found. <Link href="/pools/new" className="text-emerald-600 hover:text-emerald-500">Create a pool</Link> or <Link href="/pools" className="text-emerald-600 hover:text-emerald-500">add liquidity</Link> to get started.
                    </td>
                  </tr>
                ) : !isConnected ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                      Connect a wallet to view positions across QuantumDEX.
                    </td>
                  </tr>
                ) : (
                  positions.map((position) => {
                    const networkName =
                      networks.find((network) => network.id === position.network)?.name ?? "Unknown";
                    const lpBalanceFormatted = formatUnits(position.lpBalance, 18);
                    const reserve0Formatted = formatUnits(position.poolInfo.reserve0, 18);
                    const reserve1Formatted = formatUnits(position.poolInfo.reserve1, 18);
                    
                    return (
                      <tr key={position.poolId} className="transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{position.pair}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{networkName}</p>
                        </td>
                        <td className="px-4 py-4">{position.feeTier}</td>
                        <td className="px-4 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {parseFloat(lpBalanceFormatted).toLocaleString(undefined, { maximumFractionDigits: 4 })} LP
                        </td>
                        <td className="px-4 py-4 font-semibold text-zinc-900 dark:text-zinc-50">{position.value}</td>
                        <td className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">{position.share}</td>
                        <td className="px-4 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                          {parseFloat(reserve0Formatted).toFixed(2)} / {parseFloat(reserve1Formatted).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/pools/${encodeURIComponent(position.poolId)}`}
                            className="inline-block rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600 transition hover:border-emerald-400 hover:text-emerald-500 dark:border-zinc-700 dark:text-zinc-300"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200/60 bg-white/80 p-6 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-900/70">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Rewards</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Incentives earned via liquidity mining, routing rebates, and protocol distributions.
          </p>
          <div className="space-y-3">
            {rewards.map((reward) => (
              <div key={reward.title} className="rounded-2xl border border-zinc-200 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {reward.title}
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{isConnected ? reward.amount : "—"}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{reward.description}</p>
              </div>
            ))}
          </div>
          <button className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 disabled:bg-zinc-300 disabled:text-zinc-500" disabled={!isConnected}>
            {isConnected ? "Claim rewards" : "Connect wallet to claim"}
          </button>
        </div>
      </section>
    </main>
  );
}


"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { AppKitConnectButton } from "@reown/appkit/react";
import { useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";

import { publicClientToProvider, walletClientToSigner } from "@/config/adapter";
import { shortenAddress } from "@/lib/utils";
import { networks } from "@/config/wagmi";

const headlineStats = [
  { label: "Total Value Locked", value: "$186.4M", delta: "+2.4%", positive: true },
  { label: "24h Volume", value: "$32.9M", delta: "+6.8%", positive: true },
  { label: "Active LPs", value: "8,421", delta: "-1.2%", positive: false },
];

const featuredPools = [
  { pair: "ETH / USDC", tvl: "$46.1M", apr: "17.4%", volume: "$8.3M" },
  { pair: "WBTC / ETH", tvl: "$28.8M", apr: "12.1%", volume: "$4.5M" },
  { pair: "ARB / USDC", tvl: "$12.6M", apr: "23.8%", volume: "$2.1M" },
];

const quickActions = [
  { href: "/swap", label: "Launch Swap", description: "Trade spot instantly across supported pools." },
  { href: "/pools/new", label: "Create Pool", description: "Spin up a new pair and seed bootstrapped liquidity." },
  { href: "/portfolio", label: "Manage Liquidity", description: "Track yields, rebalance, and compound rewards at once." },
];

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const activeNetwork = useMemo(
    () => (chainId ? networks.find((item) => item.id === chainId) : undefined),
    [chainId],
  );

  useEffect(() => {
    if (!walletClient) return;
    const logSigner = async () => {
      const signer = await walletClientToSigner(walletClient);
      if (process.env.NODE_ENV === "development") {
        console.log("🔑 Ethers signer ready:", signer);
      }
    };
    logSigner();
  }, [walletClient]);

  useEffect(() => {
    if (!publicClient || process.env.NODE_ENV !== "development") return;
    const provider = publicClientToProvider(publicClient);
    console.log("📡 Read provider ready:", provider);
  }, [publicClient]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-14">
      <section className="relative overflow-hidden rounded-[40px] border border-zinc-200/60 bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-900/80 px-10 py-14 text-white shadow-[0_20px_60px_-30px_rgba(22,101,52,0.75)] dark:border-zinc-800">
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute -right-20 top-12 h-80 w-80 rounded-full bg-emerald-400/30 blur-3xl" />
        </div>
        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
          <div className="max-w-xl space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-1 text-sm font-semibold uppercase tracking-[0.4em] text-emerald-100">
              QuantumDEX
            </span>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              Execute multi-chain swaps with institutional-grade liquidity.
            </h1>
            <p className="text-lg text-emerald-100/80">
              Connect via WalletConnect or MetaMask, route across deep liquidity sources, and settle trades in seconds. Built with Reown AppKit, Wagmi, and ethers for production-grade experiences.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              {!isConnected ? (
                <AppKitConnectButton label="Connect Wallet" size="lg" />
              ) : (
                <>
                  <Link
                    href="/swap"
                    className="rounded-full bg-white/15 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-white/25"
                  >
                    Launch Swap Terminal
                  </Link>
                  <Link
                    href="/portfolio"
                    className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-emerald-100 transition hover:border-white hover:text-white"
                  >
                    View Portfolio
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="grid w-full max-w-sm grid-cols-1 gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md lg:max-w-md">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100/80">
              Session Snapshot
            </h2>
            <div className="space-y-3 text-sm text-emerald-50/80">
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Status</span>
                <span className="flex items-center gap-2 font-medium text-emerald-200">
                  <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-zinc-500"}`} />
                  {isConnected ? "Connected" : "Not Connected"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Network</span>
                <span className="font-medium text-white">
                  {activeNetwork?.name ?? "—"}
                </span>
              </div>
              <div className="flex items-start justify-between rounded-2xl bg-white/5 px-4 py-3">
                <span>Wallet</span>
                <span className="max-w-[12rem] text-right font-medium text-white">
                  {isConnected && address ? shortenAddress(address, 5) : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {headlineStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-zinc-200/60 bg-white/70 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/70"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{stat.value}</p>
            <p
              className={`mt-2 text-sm font-medium ${
                stat.positive ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {stat.delta} last 24h
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
        <div className="rounded-3xl border border-zinc-200/60 bg-white/80 p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex items-start justify-between mb-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Top Performing Pools</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Real-time analytics for the most efficient routes.</p>
            </div>
            <Link
              href="/pools"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500 hover:text-white hover:border-emerald-500 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white"
            >
              View all →
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50/50 to-white dark:border-zinc-800/80 dark:from-zinc-950/50 dark:to-zinc-900/50">
            <table className="min-w-full divide-y divide-zinc-200/60 text-sm dark:divide-zinc-800/60">
              <thead className="bg-zinc-100/80 dark:bg-zinc-900/80">
                <tr className="text-left text-xs font-bold uppercase tracking-[0.1em] text-zinc-600 dark:text-zinc-400">
                  <th className="px-6 py-4">Pool</th>
                  <th className="px-6 py-4 text-right">TVL</th>
                  <th className="px-6 py-4 text-right">Volume (24h)</th>
                  <th className="px-6 py-4 text-right">Est. APR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/40 bg-white/60 dark:divide-zinc-800/40 dark:bg-zinc-950/30">
                {featuredPools.map((pool, index) => (
                  <tr 
                    key={pool.pair} 
                    className="group transition-all hover:bg-gradient-to-r hover:from-emerald-50/80 hover:to-emerald-100/40 dark:hover:from-emerald-500/5 dark:hover:to-emerald-500/10"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-bold text-white shadow-sm">
                          {index + 1}
                        </div>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{pool.pair}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-zinc-700 dark:text-zinc-300">{pool.tvl}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-zinc-700 dark:text-zinc-300">{pool.volume}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                        {pool.apr}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex flex-col gap-6 rounded-3xl border border-zinc-200/60 bg-white/80 p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Strategy Center</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Shortcut into high-intent tasks with curated workflows built for professional liquidity desks.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50/50 px-5 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 dark:border-zinc-700 dark:from-zinc-900/70 dark:to-zinc-950/50 dark:hover:border-emerald-400/70 dark:hover:bg-emerald-500/5"
              >
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-zinc-900 transition group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-emerald-400">
                        {action.label}
                      </span>
                      <span className="text-xs font-medium text-emerald-500 opacity-0 transition-opacity group-hover:opacity-100">
                        →
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-600 transition group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-300">
                      {action.description}
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 transition-all group-hover:from-emerald-500/5 group-hover:to-emerald-400/5" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

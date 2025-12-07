"use client";

import Link from "next/link";
import { AppKitConnectButton } from "@reown/appkit/react";
import { useAccount } from "wagmi";

export const Hero = () => {
  const { isConnected } = useAccount();

  return (
    <section className="relative overflow-hidden rounded-[40px] border border-purple-200/60 bg-gradient-to-br from-purple-950 via-purple-900 to-lilac-900/80 px-8 py-16 text-white shadow-[0_20px_60px_-30px_rgba(147,51,234,0.75)] dark:border-purple-800/60 md:px-12 md:py-20">
      {/* Background gradient effects */}
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -right-20 top-12 h-80 w-80 rounded-full bg-lilac-400/30 blur-3xl" />
        <div className="absolute -left-20 bottom-12 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-purple-400/15 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.4em] text-purple-100">
          QuantumDEX
        </span>
        
        <h1 className="mt-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
          The Future of Decentralized Exchange & Token Streaming
        </h1>
        
        <p className="mt-6 text-lg leading-relaxed text-purple-100/80 md:text-xl">
          Experience seamless token swaps with deep liquidity and continuous payment streams. 
          Built for the next generation of DeFi on Ethereum-compatible chains.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {!isConnected ? (
            <AppKitConnectButton 
              label="Connect Wallet" 
              size="lg"
            />
          ) : (
            <>
              <Link
                href="/swap"
                className="rounded-full bg-white/15 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-purple-500/25 transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-purple-900"
              >
                Launch Swap Terminal
              </Link>
              <Link
                href="/portfolio"
                className="rounded-full border border-white/40 px-8 py-4 text-base font-semibold text-purple-100 transition hover:border-white hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-purple-900"
              >
                View Portfolio
              </Link>
            </>
          )}
        </div>

        {/* Feature highlights */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div className="text-2xl mb-2">🔄</div>
            <h3 className="text-lg font-semibold mb-1">Instant Swaps</h3>
            <p className="text-sm text-purple-100/70">
              Trade tokens instantly across liquidity pools with minimal slippage
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div className="text-2xl mb-2">💧</div>
            <h3 className="text-lg font-semibold mb-1">Token Streaming</h3>
            <p className="text-sm text-purple-100/70">
              Create continuous payment streams with flexible parameters
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:col-span-2 lg:col-span-1">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-lg font-semibold mb-1">Deep Liquidity</h3>
            <p className="text-sm text-purple-100/70">
              Access institutional-grade liquidity across multiple pools
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};


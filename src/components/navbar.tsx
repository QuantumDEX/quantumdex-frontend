"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppKitButton,
} from "@reown/appkit/react";
import { useAccount, useChainId, useDisconnect } from "wagmi";

import { shortenAddress } from "@/lib/utils";
import { networks } from "@/config/wagmi";

// Network icon URLs - using reliable CDN sources
const NETWORK_ICONS: Record<number, string> = {
  1: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  8453: "https://cryptologos.cc/logos/base-base-logo.png",
  42161: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
  10: "https://cryptologos.cc/logos/optimism-ethereum-op-logo.png",
  137: "https://cryptologos.cc/logos/polygon-matic-logo.png",
};

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/swap", label: "Swap" },
  { href: "/pools", label: "Pools" },
  { href: "/portfolio", label: "Portfolio" },
];

export const Navbar = () => {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const displayAddress = useMemo(() => {
    if (!address) return null;
    return shortenAddress(address);
  }, [address]);

  const networkInfo = useMemo(() => {
    if (!chainId) return null;
    const network = networks.find((item) => item.id === chainId);
    const iconUrl = NETWORK_ICONS[chainId] || null;
    return network ? { name: network.name, icon: iconUrl } : { name: `Chain ${chainId}`, icon: iconUrl };
  }, [chainId]);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/75 backdrop-blur-md transition dark:border-zinc-800/60 dark:bg-black/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-emerald-500 transition hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300">
          QuantumDEX
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {isConnected && displayAddress && networkInfo ? (
            <>
              <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 lg:flex">
                <span>{displayAddress}</span>
                <span className="text-zinc-400">|</span>
                {networkInfo.icon ? (
                  <img 
                    src={networkInfo.icon} 
                    alt={networkInfo.name} 
                    className="h-4 w-4 rounded-full"
                  />
                ) : null}
                <span>{networkInfo.name}</span>
              </div>
              <button
                onClick={() => disconnect()}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-emerald-400 dark:hover:text-emerald-300"
              >
                Disconnect
              </button>
            </>
          ) : (
            <AppKitButton label="Connect" size="md" />
          )}
        </div>
      </div>
    </header>
  );
};


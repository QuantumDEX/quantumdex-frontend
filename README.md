# QuantumDEX — Frontend (Next.js)

This folder contains the Next.js frontend that will be used to interact with the Solidity AMM deployed by the `smart-contracts` package.

This project was scaffolded with `create-next-app` (TypeScript + Tailwind). The app UI and component structure should be a port of the original Stacks/Clarity frontend (root `frontend/`), adapted to use ethers/wagmi for Ethereum-compatible chains.

## Quick start

```bash
cd QuantumDEX/frontend
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

## Purpose

Port the existing Stacks frontend to a modern Ethereum stack:

- Replace Clarity SDK calls with ethers/wagmi calls
- Use event listeners and contract reads to populate pool data
- Connect to wallets using Reown AppKit + Wagmi (or an alternative preferred by maintainers)

## Progress Summary

**Completed (3/9):**
- ✅ Wallet Integration — Reown AppKit + Wagmi
- ✅ Ethers/Wagmi Adapter & Provider
- ✅ Styling, Accessibility & Responsiveness

**Pending (6/9):**
- ❌ Port `lib/amm.ts` to ethers (contract bindings) — **CRITICAL: Blocks all contract interactions**
- ❌ Swap Component — UI ready, needs contract integration
- ❌ Pools List & Pool Details Component — UI ready, needs contract integration
- ❌ Add / Remove Liquidity Components — Not started
- ❌ Create Pool Component — UI ready, needs contract integration
- ❌ Frontend Unit/E2E Tests — Not started

## Contributing via Issues

We want every work item to be an issue contributors can pick and implement. The list below is written so it can be copied directly into GitHub issues. Each item contains a short description and acceptance criteria.

Frontend issues (copy each bullet as a new GitHub issue):

- ✅ Wallet Integration — Reown AppKit + Wagmi

  - Description: Add wallet connection using Reown AppKit (WalletConnect) + Wagmi. Provide a `Navbar` component that shows connect/disconnect, address and network.
  - Acceptance: Users can connect with MetaMask and WalletConnect; address displays; signer is available to send transactions.
  - **Status: COMPLETED** — Navbar component implemented with AppKit integration, wallet connection, and network display.

- ✅ Ethers/Wagmi Adapter & Provider

  - Description: Create `src/config/wagmi.ts` and `src/config/adapter.ts` to expose providers and signers to the app.
  - Acceptance: Hooks/components can get an ethers provider and signer from the adapter; examples in dev console.
  - **Status: COMPLETED** — Both files implemented with `walletClientToSigner` and `publicClientToProvider` utilities.

- ❌ Port `lib/amm.ts` to ethers (contract bindings)

  - Description: Replace Clarity SDK helpers with ethers contract wrappers to call AMM contract functions and read events.
  - Acceptance: Functions `getAllPools`, `createPool`, `addLiquidity`, `removeLiquidity`, `swap`, `getUserLiquidity` are implemented and return expected types.
  - **Status: PENDING** — Contract interaction helpers not yet implemented. Need to create `lib/amm.ts` with ethers contract bindings.

- ❌ Swap Component

  - Description: Port `src/components/swap.tsx` to use the new contract helpers and wallet signer to send swap transactions.
  - Acceptance: User selects tokens, enters amount, sees estimated output and can submit a swap (tx is created and sent).
  - **Status: PENDING** — UI exists at `/swap` but uses mock data. Needs contract integration via `lib/amm.ts`.

- ❌ Pools List & Pool Details Component

  - Description: Build UI to list pools by reading events or contract state; show pool details and balances.
  - Acceptance: Pools appear and pool detail page shows liquidity and balances.
  - **Status: PENDING** — UI exists at `/pools` but displays mock data. Needs to read from contract events/state.

- ❌ Add / Remove Liquidity Components

  - Description: Implement UI for adding and removing liquidity, with input validation and ratio calculation.
  - Acceptance: Transactions sent to contract with correct arguments; UI displays success/failure.
  - **Status: PENDING** — No dedicated components for add/remove liquidity flows yet.

- ❌ Create Pool Component

  - Description: Allow users to create new pools (token pair + fee) with deterministic ordering of token addresses.
  - Acceptance: Pool-create tx emitted and new pool appears in pools list (via event).
  - **Status: PENDING** — UI exists at `/pools/new` but form submission not connected to contract.

- ✅ Styling, Accessibility & Responsiveness

  - Description: Polish UI using Tailwind; ensure components are responsive and accessible.
  - Acceptance: UI passes basic accessibility checks (labels, focus states) and works on mobile widths.
  - **Status: COMPLETED** — Modern, responsive UI with Tailwind CSS implemented across all pages.

- ❌ Frontend Unit/E2E Tests
  - Description: Add unit tests for helpers and integration/e2e tests for critical flows (connect, swap, add liquidity).
  - Acceptance: CI runs tests and reports pass/fail.
  - **Status: PENDING** — No test suite implemented yet.

## Branch / PR workflow

1. Pick an issue and comment "I am working on this".
2. Create a branch: `issue/<id>-short-description` (e.g. `issue/12-wallet-integration`).
3. Open a PR against `main` and reference the issue: "Closes #<issue-number>".
4. Add a short description, screenshots (if UI), and the testing steps in the PR.

### PR checklist (required for merge):

- [ ] Linted and type-checked
- [ ] Tests added or updated (if applicable)
- [ ] Reviewed and approved by at least one maintainer
- [ ] Linked to a GitHub issue

Note: If you'd like me to replace the existing `README.md` with this content I can do so — confirm and I will overwrite it. Alternatively, you can copy this file into `README.md` locally.

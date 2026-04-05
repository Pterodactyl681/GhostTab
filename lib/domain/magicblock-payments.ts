export type SolanaCluster = "devnet" | "testnet" | "mainnet-beta" | "localnet";

export type MagicBlockHealthStatus = "ok" | "degraded" | "down";

export type MagicBlockHealthResult = {
  ok: boolean;
  status: MagicBlockHealthStatus;
  cluster: string;
  statusMessage: string;
};

export type MintInitializationStatusInput = {
  mint: string;
};

export type MintInitializationStatusResult = {
  mint: string;
  initialized: boolean;
  statusMessage: string;
};

export type InitializeMintInput = {
  mint: string;
  decimals?: number;
  authority?: string;
};

export type InitializeMintResult = {
  mint: string;
  initialized: boolean;
  signature?: string;
  statusMessage: string;
};

export type DepositInput = {
  mint: string;
  owner: string;
  amount: string;
  reference?: string;
  sessionId?: string;
};

export type DepositResult = {
  mint: string;
  owner: string;
  amount: string;
  signature?: string;
  statusMessage: string;
};

export type BalanceInput = {
  mint: string;
  owner: string;
};

export type BalanceResult = {
  mint: string;
  owner: string;
  amount: string;
  statusMessage: string;
};

export type PrivateBalanceInput = {
  mint: string;
  owner: string;
  viewKey?: string;
};

export type PrivateBalanceResult = {
  mint: string;
  owner: string;
  amount: string;
  statusMessage: string;
};

export type TransferInput = {
  mint: string;
  from: string;
  to: string;
  amount: string;
  memo?: string;
  sessionId?: string;
};

export type TransferResult = {
  transferId?: string;
  signature?: string;
  status: "submitted" | "confirmed" | "failed";
  statusMessage: string;
};

export type WithdrawInput = {
  mint: string;
  owner: string;
  destination: string;
  amount: string;
  sessionId?: string;
};

export type WithdrawResult = {
  signature?: string;
  status: "submitted" | "confirmed" | "failed";
  statusMessage: string;
};

export type MagicBlockPaymentsClient = {
  health(): Promise<MagicBlockHealthResult>;
  isMintInitialized(
    input: MintInitializationStatusInput,
  ): Promise<MintInitializationStatusResult>;
  initializeMint(input: InitializeMintInput): Promise<InitializeMintResult>;
  deposit(input: DepositInput): Promise<DepositResult>;
  balance(input: BalanceInput): Promise<BalanceResult>;
  privateBalance(input: PrivateBalanceInput): Promise<PrivateBalanceResult>;
  transfer(input: TransferInput): Promise<TransferResult>;
  withdraw(input: WithdrawInput): Promise<WithdrawResult>;
};

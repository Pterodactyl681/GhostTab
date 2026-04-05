import type {
  BalanceInput,
  BalanceResult,
  DepositInput,
  DepositResult,
  InitializeMintInput,
  InitializeMintResult,
  MagicBlockHealthResult,
  MagicBlockPaymentsClient,
  MintInitializationStatusInput,
  MintInitializationStatusResult,
  PrivateBalanceInput,
  PrivateBalanceResult,
  TransferInput,
  TransferResult,
  WithdrawInput,
  WithdrawResult,
} from "@/lib/domain/magicblock-payments";

function notLiveResult(message: string) {
  return `${message} Demo fallback active.`;
}

export function createMockMagicBlockPaymentsClient(): MagicBlockPaymentsClient {
  return {
    async health(): Promise<MagicBlockHealthResult> {
      return {
        ok: true,
        status: "degraded",
        cluster: "devnet",
        statusMessage: notLiveResult("Private Payments API mock health."),
      };
    },
    async isMintInitialized(
      input: MintInitializationStatusInput,
    ): Promise<MintInitializationStatusResult> {
      return {
        mint: input.mint,
        initialized: false,
        statusMessage: notLiveResult("Mint state is mocked."),
      };
    },
    async initializeMint(input: InitializeMintInput): Promise<InitializeMintResult> {
      return {
        mint: input.mint,
        initialized: true,
        statusMessage: notLiveResult("Mint initialize is staged."),
      };
    },
    async deposit(input: DepositInput): Promise<DepositResult> {
      return {
        mint: input.mint,
        owner: input.owner,
        amount: input.amount,
        statusMessage: notLiveResult("Deposit is staged."),
      };
    },
    async balance(input: BalanceInput): Promise<BalanceResult> {
      return {
        mint: input.mint,
        owner: input.owner,
        amount: "0",
        statusMessage: notLiveResult("Balance is mocked."),
      };
    },
    async privateBalance(input: PrivateBalanceInput): Promise<PrivateBalanceResult> {
      return {
        mint: input.mint,
        owner: input.owner,
        amount: "0",
        statusMessage: notLiveResult("Private balance is mocked."),
      };
    },
    async transfer(_input: TransferInput): Promise<TransferResult> {
      return {
        status: "submitted",
        statusMessage: notLiveResult("Transfer is staged."),
      };
    },
    async withdraw(_input: WithdrawInput): Promise<WithdrawResult> {
      return {
        status: "submitted",
        statusMessage: notLiveResult("Withdraw is staged."),
      };
    },
  };
}

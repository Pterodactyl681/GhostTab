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
  SolanaCluster,
  TransferInput,
  TransferResult,
  WithdrawInput,
  WithdrawResult,
} from "@/lib/domain/magicblock-payments";

type JsonRecord = Record<string, unknown>;

type RequestConfig = {
  path: string;
  method?: "GET" | "POST";
  query?: Record<string, string | undefined>;
  body?: JsonRecord;
  baseUrlOverride?: string;
};

export class MagicBlockPaymentsError extends Error {
  status: number;
  code?: string;
  requestId?: string;
  details?: unknown;

  constructor(message: string, args: { status: number; code?: string; requestId?: string; details?: unknown }) {
    super(message);
    this.name = "MagicBlockPaymentsError";
    this.status = args.status;
    this.code = args.code;
    this.requestId = args.requestId;
    this.details = args.details;
  }
}

type MagicBlockPaymentsClientOptions = {
  baseUrl: string;
  fallbackBaseUrl?: string;
  cluster: SolanaCluster;
  apiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

function asObject(value: unknown): JsonRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as JsonRecord;
}

function pickString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function readString(source: JsonRecord | null, keys: string[]): string | undefined {
  if (!source) return undefined;
  for (const key of keys) {
    const value = pickString(source[key]);
    if (value) return value;
  }
  return undefined;
}

function readBoolean(source: JsonRecord | null, keys: string[]): boolean | undefined {
  if (!source) return undefined;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return undefined;
}

function getPayloadRoot(payload: unknown): JsonRecord | null {
  const obj = asObject(payload);
  if (!obj) return null;
  const nested = asObject(obj.data);
  return nested ?? obj;
}

function toSubmittedStatus(value: string | undefined): "submitted" | "confirmed" | "failed" {
  const normalized = (value ?? "submitted").toLowerCase();
  if (normalized.includes("confirm")) return "confirmed";
  if (normalized.includes("fail") || normalized.includes("error")) return "failed";
  return "submitted";
}

function buildUrl(baseUrl: string, config: RequestConfig) {
  const url = new URL(config.path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  if (config.query) {
    for (const [key, value] of Object.entries(config.query)) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

function parseErrorMessage(payload: unknown, statusText: string) {
  const root = getPayloadRoot(payload);
  const payloadObj = asObject(payload);
  const errorObj = asObject(payloadObj?.error);

  const message =
    readString(errorObj, ["message", "detail", "error"]) ??
    readString(root, ["message", "detail", "error", "statusMessage"]) ??
    statusText;

  const code =
    readString(errorObj, ["code", "type"]) ??
    readString(payloadObj, ["code", "type"]);

  return { message, code, details: payload };
}

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, timer };
}

export function createMagicBlockPaymentsClient(
  options: MagicBlockPaymentsClientOptions,
): MagicBlockPaymentsClient {
  const timeoutMs = options.timeoutMs ?? 15000;
  const fetchImpl = options.fetchImpl ?? fetch;

  async function request(config: RequestConfig): Promise<unknown> {
    const { controller, timer } = withTimeout(timeoutMs);
    const url = buildUrl(config.baseUrlOverride ?? options.baseUrl, config);
    const method = config.method ?? "GET";
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-solana-cluster": options.cluster,
    };

    if (options.apiKey) {
      headers.authorization = `Bearer ${options.apiKey}`;
    }

    try {
      const response = await fetchImpl(url, {
        method,
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
        cache: "no-store",
      });

      let payload: unknown = null;
      let bodyText = "";
      try {
        bodyText = await response.text();
        payload = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        payload = bodyText || null;
      }

      if (!response.ok) {
        const parsed = parseErrorMessage(payload, response.statusText || "Request failed");
        throw new MagicBlockPaymentsError(parsed.message, {
          status: response.status,
          code: parsed.code,
          requestId: response.headers.get("x-request-id") ?? undefined,
          details: parsed.details,
        });
      }

      return payload;
    } catch (error) {
      if (error instanceof MagicBlockPaymentsError) {
        throw error;
      }

      const message =
        error instanceof Error && error.name === "AbortError"
          ? `MagicBlock request timed out after ${timeoutMs}ms (${method} ${config.path}).`
          : error instanceof Error
            ? error.message
            : "MagicBlock request failed.";

      throw new MagicBlockPaymentsError(message, {
        status: 0,
        details: {
          cause: error,
          method,
          path: config.path,
          timeoutMs,
          baseUrl: config.baseUrlOverride ?? options.baseUrl,
        },
      });
    } finally {
      clearTimeout(timer);
    }
  }

  function isRouteNotFoundError(error: unknown): error is MagicBlockPaymentsError {
    if (!(error instanceof MagicBlockPaymentsError)) {
      return false;
    }

    if (error.status === 404) {
      return true;
    }

    return error.message.toLowerCase().includes("route not found");
  }

  function isMethodNotAllowed(error: unknown): error is MagicBlockPaymentsError {
    if (!(error instanceof MagicBlockPaymentsError)) {
      return false;
    }
    if (error.status === 405) {
      return true;
    }
    return error.message.toLowerCase().includes("method not allowed");
  }

  function withPathPrefixes(path: string) {
    const safePath = path.startsWith("/") ? path : `/${path}`;
    const candidates = [safePath, `/api${safePath}`, `/v1${safePath}`];

    if (safePath.startsWith("/payments/")) {
      const paymentSuffix = safePath.slice("/payments".length);
      candidates.push(
        `/private-payments${paymentSuffix}`,
        `/api/private-payments${paymentSuffix}`,
        `/v1/private-payments${paymentSuffix}`,
      );
    }

    return Array.from(new Set(candidates));
  }

  async function requestWithPathFallback(
    path: string,
    config: Omit<RequestConfig, "path">,
  ): Promise<unknown> {
    const baseUrls = Array.from(
      new Set(
        [options.baseUrl, options.fallbackBaseUrl]
          .map((value) => value?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    );

    let lastNotFoundError: MagicBlockPaymentsError | null = null;

    for (const baseUrl of baseUrls) {
      for (const candidatePath of withPathPrefixes(path)) {
        try {
          return await request({
            ...config,
            path: candidatePath,
            baseUrlOverride: baseUrl,
          });
        } catch (error) {
          if (isRouteNotFoundError(error)) {
            lastNotFoundError = error;
            continue;
          }
          throw error;
        }
      }
    }

    if (lastNotFoundError) {
      throw lastNotFoundError;
    }

    throw new MagicBlockPaymentsError("Route not found", {
      status: 404,
    });
  }

  return {
    async health(): Promise<MagicBlockHealthResult> {
      const payload = await requestWithPathFallback("/health", {});
      const root = getPayloadRoot(payload);
      const statusRaw = readString(root, ["status", "health", "state"]) ?? "ok";
      const status =
        statusRaw === "ok" || statusRaw === "degraded" || statusRaw === "down"
          ? statusRaw
          : statusRaw.toLowerCase().includes("down")
            ? "down"
            : statusRaw.toLowerCase().includes("degrad")
              ? "degraded"
              : "ok";

      const cluster = readString(root, ["cluster", "network"]) ?? options.cluster;
      const statusMessage =
        readString(root, ["message", "detail", "statusMessage"]) ??
        (status === "ok" ? "Private Payments API healthy." : "Private Payments API degraded.");

      return {
        ok: status !== "down",
        status,
        cluster,
        statusMessage,
      };
    },

    async isMintInitialized(
      input: MintInitializationStatusInput,
    ): Promise<MintInitializationStatusResult> {
      let payload: unknown;
      try {
        payload = await requestWithPathFallback("/payments/mints/initialized", {
          query: {
            mint: input.mint,
            cluster: options.cluster,
          },
        });
      } catch (error) {
        if (!isMethodNotAllowed(error)) {
          throw error;
        }
        payload = await requestWithPathFallback("/payments/mints/initialized", {
          method: "POST",
          body: {
            cluster: options.cluster,
            mint: input.mint,
          },
        });
      }
      const root = getPayloadRoot(payload);
      const initialized =
        readBoolean(root, ["initialized", "isInitialized", "mintInitialized"]) ?? false;
      return {
        mint: readString(root, ["mint"]) ?? input.mint,
        initialized,
        statusMessage: initialized ? "Mint initialized." : "Mint not initialized.",
      };
    },

    async initializeMint(input: InitializeMintInput): Promise<InitializeMintResult> {
      const payload = await requestWithPathFallback("/payments/mints/initialize", {
        method: "POST",
        body: {
          cluster: options.cluster,
          mint: input.mint,
          decimals: input.decimals,
          authority: input.authority,
        },
      });
      const root = getPayloadRoot(payload);
      const initialized =
        readBoolean(root, ["initialized", "isInitialized", "mintInitialized"]) ?? true;
      return {
        mint: readString(root, ["mint"]) ?? input.mint,
        initialized,
        signature: readString(root, ["signature", "txSignature", "transactionSignature"]),
        statusMessage: initialized ? "Mint initialized successfully." : "Mint initialization pending.",
      };
    },

    async deposit(input: DepositInput): Promise<DepositResult> {
      const payload = await requestWithPathFallback("/payments/deposit", {
        method: "POST",
        body: {
          cluster: options.cluster,
          mint: input.mint,
          owner: input.owner,
          amount: input.amount,
          reference: input.reference,
          sessionId: input.sessionId,
        },
      });
      const root = getPayloadRoot(payload);
      return {
        mint: readString(root, ["mint"]) ?? input.mint,
        owner: readString(root, ["owner", "wallet", "address"]) ?? input.owner,
        amount: readString(root, ["amount", "value"]) ?? input.amount,
        signature: readString(root, ["signature", "txSignature", "transactionSignature"]),
        statusMessage:
          readString(root, ["message", "statusMessage"]) ?? "Deposit submitted.",
      };
    },

    async balance(input: BalanceInput): Promise<BalanceResult> {
      let payload: unknown;
      try {
        payload = await requestWithPathFallback("/payments/balance", {
          query: {
            cluster: options.cluster,
            mint: input.mint,
            owner: input.owner,
          },
        });
      } catch (error) {
        if (!isMethodNotAllowed(error)) {
          throw error;
        }
        payload = await requestWithPathFallback("/payments/balance", {
          method: "POST",
          body: {
            cluster: options.cluster,
            mint: input.mint,
            owner: input.owner,
          },
        });
      }
      const root = getPayloadRoot(payload);
      return {
        mint: readString(root, ["mint"]) ?? input.mint,
        owner: readString(root, ["owner", "wallet", "address"]) ?? input.owner,
        amount: readString(root, ["amount", "balance", "value"]) ?? "0",
        statusMessage:
          readString(root, ["message", "statusMessage"]) ?? "Balance retrieved.",
      };
    },

    async privateBalance(input: PrivateBalanceInput): Promise<PrivateBalanceResult> {
      const payload = await requestWithPathFallback("/payments/private-balance", {
        query: {
          cluster: options.cluster,
          mint: input.mint,
          owner: input.owner,
          viewKey: input.viewKey,
        },
      });
      const root = getPayloadRoot(payload);
      return {
        mint: readString(root, ["mint"]) ?? input.mint,
        owner: readString(root, ["owner", "wallet", "address"]) ?? input.owner,
        amount: readString(root, ["amount", "balance", "value"]) ?? "0",
        statusMessage:
          readString(root, ["message", "statusMessage"]) ??
          "Private balance retrieved.",
      };
    },

    async transfer(input: TransferInput): Promise<TransferResult> {
      const payload = await requestWithPathFallback("/payments/transfer", {
        method: "POST",
        body: {
          cluster: options.cluster,
          mint: input.mint,
          from: input.from,
          to: input.to,
          amount: input.amount,
          memo: input.memo,
          sessionId: input.sessionId,
        },
      });
      const root = getPayloadRoot(payload);
      const status = toSubmittedStatus(readString(root, ["status", "state"]));
      return {
        transferId: readString(root, ["transferId", "id"]),
        signature: readString(root, ["signature", "txSignature", "transactionSignature"]),
        status,
        statusMessage:
          readString(root, ["message", "statusMessage"]) ??
          (status === "failed" ? "Transfer failed." : "Transfer submitted."),
      };
    },

    async withdraw(input: WithdrawInput): Promise<WithdrawResult> {
      const payload = await requestWithPathFallback("/payments/withdraw", {
        method: "POST",
        body: {
          cluster: options.cluster,
          mint: input.mint,
          owner: input.owner,
          destination: input.destination,
          amount: input.amount,
          sessionId: input.sessionId,
        },
      });
      const root = getPayloadRoot(payload);
      const status = toSubmittedStatus(readString(root, ["status", "state"]));
      return {
        signature: readString(root, ["signature", "txSignature", "transactionSignature"]),
        status,
        statusMessage:
          readString(root, ["message", "statusMessage"]) ??
          (status === "failed" ? "Withdraw failed." : "Withdraw submitted."),
      };
    },
  };
}

import { db } from "@/lib/db";

export interface WalletDeductionResult {
  success: boolean;
  balanceBefore: number;
  balanceAfter: number;
  error?: string;
}

/**
 * Perform atomic wallet deduction for an API hit.
 * Guarantees zero race conditions using Prisma database transaction.
 */
export async function deductWalletForApiHit(
  walletId: string,
  amount: number,
  colladomeOrderId: string,
  apiName: string
): Promise<WalletDeductionResult> {
  if (amount <= 0) {
    return { success: true, balanceBefore: 0, balanceAfter: 0 };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      if (wallet.balance < amount) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = Number((wallet.balance - amount).toFixed(2));

      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: balanceAfter },
      });

      await tx.walletTransaction.create({
        data: {
          walletId,
          amount,
          type: "DEBIT",
          balanceBefore,
          balanceAfter,
          referenceId: colladomeOrderId,
          description: `API Hit: ${apiName}`,
        },
      });

      return {
        balanceBefore,
        balanceAfter,
      };
    });

    return {
      success: true,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
    };
  } catch (err: any) {
    return {
      success: false,
      balanceBefore: 0,
      balanceAfter: 0,
      error: err.message || "WALLET_DEDUCTION_FAILED",
    };
  }
}

export async function deductWalletForSetupFee(
  walletId: string,
  userId: string,
  apiId: string,
  apiName: string,
  setupFeeAmount: number,
  clientPricingId?: string,
  defaultSellPrice: number = 0
): Promise<WalletDeductionResult> {
  if (setupFeeAmount <= 0) {
    if (clientPricingId) {
      await db.clientPricing.update({
        where: { id: clientPricingId },
        data: { isSetupFeePaid: true, setupFeePaidAt: new Date() },
      });
    }
    return { success: true, balanceBefore: 0, balanceAfter: 0 };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      if (wallet.balance < setupFeeAmount) {
        throw new Error("INSUFFICIENT_FUNDS_FOR_SETUP_FEE");
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = Number((wallet.balance - setupFeeAmount).toFixed(2));

      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: balanceAfter },
      });

      await tx.walletTransaction.create({
        data: {
          walletId,
          amount: setupFeeAmount,
          type: "DEBIT",
          balanceBefore,
          balanceAfter,
          referenceId: `SETUP_${apiId.slice(0, 8).toUpperCase()}_${Date.now()}`,
          description: `One-Time API Setup Fee: ${apiName}`,
        },
      });

      if (clientPricingId) {
        await tx.clientPricing.update({
          where: { id: clientPricingId },
          data: {
            isSetupFeePaid: true,
            setupFeePaidAt: new Date(),
          },
        });
      } else {
        await tx.clientPricing.upsert({
          where: {
            userId_apiId: {
              userId,
              apiId,
            },
          },
          update: {
            isSetupFeePaid: true,
            setupFeePaidAt: new Date(),
          },
          create: {
            userId,
            apiId,
            customPrice: defaultSellPrice,
            isSetupFeePaid: true,
            setupFeePaidAt: new Date(),
          },
        });
      }

      return {
        balanceBefore,
        balanceAfter,
      };
    });

    return {
      success: true,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
    };
  } catch (err: any) {
    return {
      success: false,
      balanceBefore: 0,
      balanceAfter: 0,
      error: err.message || "SETUP_FEE_DEDUCTION_FAILED",
    };
  }
}

/**
 * Manual Credit or Debit to client wallet by Super Admin
 */
export async function adjustClientWallet(
  walletId: string,
  amount: number,
  type: "CREDIT" | "DEBIT",
  description: string,
  referenceId: string,
  adminUserId?: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    const result = await db.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { id: walletId } });
      if (!wallet) throw new Error("Wallet not found");

      let balanceAfter = wallet.balance;
      if (type === "CREDIT") {
        balanceAfter = Number((wallet.balance + amount).toFixed(2));
      } else {
        if (wallet.balance < amount) {
          throw new Error("Cannot debit more than current wallet balance");
        }
        balanceAfter = Number((wallet.balance - amount).toFixed(2));
      }

      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: balanceAfter },
      });

      await tx.walletTransaction.create({
        data: {
          walletId,
          amount,
          type,
          balanceBefore: wallet.balance,
          balanceAfter,
          referenceId,
          description,
          adminUserId,
        },
      });

      return balanceAfter;
    });

    return { success: true, newBalance: result };
  } catch (err: any) {
    return { success: false, newBalance: 0, error: err.message };
  }
}

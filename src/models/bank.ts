import BankAccount from "./bank-account";
import GlobalRegistry from "../services/GlobalRegistry";
import type {
  BankOptions,
  UserId,
  BankId,
  BankAccountId,
} from "@/types/Common";

// Custom error classes for better error handling
class BankError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BankError";
  }
}

class InsufficientFundsError extends BankError {
  constructor(accountId: string, requested: number, available: number) {
    super(
      `Insufficient funds in account ${accountId}: requested ${requested}, available ${available}`
    );
    this.name = "InsufficientFundsError";
  }
}

class AccountNotFoundError extends BankError {
  constructor(accountId: string) {
    super(`Account not found: ${accountId}`);
    this.name = "AccountNotFoundError";
  }
}

class UserNotFoundError extends BankError {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = "UserNotFoundError";
  }
}

class Bank {
  private id: BankId;
  private accounts: Map<BankAccountId, BankAccount>;
  private isNegativeAllowed: boolean;

  private constructor(options: BankOptions = {}) {
    this.id = crypto.randomUUID();
    this.accounts = new Map();
    this.isNegativeAllowed = options.isNegativeAllowed ?? false;
    GlobalRegistry.registerBank(this);
  }

  static create(options: BankOptions = {}): Bank {
    return new Bank(options);
  }

  getId(): BankId {
    return this.id;
  }

  createAccount(initialBalance: number): BankAccount {
    if (initialBalance < 0 && !this.isNegativeAllowed) {
      throw new BankError(
        "Cannot create account with negative balance when negative balances are not allowed"
      );
    }

    const account = BankAccount.create(initialBalance, this.isNegativeAllowed);
    this.accounts.set(account.getId(), account);
    return account;
  }

  getAccount(accountId: BankAccountId): BankAccount {
    const account =
      this.accounts.get(accountId) ?? GlobalRegistry.getAccount(accountId);
    if (!account) {
      throw new AccountNotFoundError(accountId);
    }
    return account;
  }

  private findUserAccount(userId: UserId): BankAccountId {
    const user = GlobalRegistry.getUser(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const accountId = user.getAccountIds().find((id) => this.accounts.has(id));
    if (!accountId) {
      throw new AccountNotFoundError(
        `No account found for user ${userId} in bank ${this.id}`
      );
    }

    return accountId;
  }

  private findUserAccountInBank(userId: UserId, bankId: BankId): BankAccountId {
    const user = GlobalRegistry.getUser(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    const targetBank =
      bankId === this.id ? this : GlobalRegistry.getBank(bankId);
    if (!targetBank) {
      throw new BankError(`Bank not found: ${bankId}`);
    }

    const accountId = user
      .getAccountIds()
      .find((id) => targetBank.accounts.has(id));
    if (!accountId) {
      throw new AccountNotFoundError(
        `No account found for user ${userId} in bank ${bankId}`
      );
    }

    return accountId;
  }

  send(
    fromUserId: UserId,
    toUserId: UserId,
    amount: number,
    toBankId: BankId = this.id
  ): void {
    if (amount <= 0) {
      throw new BankError("Transfer amount must be positive");
    }

    // Find source and target accounts
    const fromAccountId = this.findUserAccount(fromUserId);
    const toAccountId = this.findUserAccountInBank(toUserId, toBankId);

    // Get accounts from registry
    const fromAccount = this.getAccount(fromAccountId);
    const toAccount = GlobalRegistry.getAccount(toAccountId);

    if (!toAccount) {
      throw new AccountNotFoundError(toAccountId);
    }

    try {
      // Perform the transfer atomically
      fromAccount.debit(amount);
      toAccount.credit(amount);
    } catch (error) {
      // If debit fails, no need to revert as credit wasn't performed
      // If credit fails (unlikely), we need to revert the debit
      if (error instanceof Error && error.message !== "Insufficient funds") {
        fromAccount.credit(amount); // Revert the debit
        throw new BankError(`Transfer failed: ${error.message}`);
      }
      throw error;
    }
  }

  // New method to check if an account belongs to this bank
  hasAccount(accountId: BankAccountId): boolean {
    return this.accounts.has(accountId);
  }

  // New method to get all accounts in the bank
  getAccounts(): BankAccount[] {
    return Array.from(this.accounts.values());
  }
}

export default Bank;

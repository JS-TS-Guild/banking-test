import { v4 as uuidv4 } from "uuid";
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
    this.id = uuidv4();
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

  private findUserAccounts(userId: UserId): BankAccountId[] {
    const user = GlobalRegistry.getUser(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // Get all accounts for this user in this bank, maintaining priority order
    const accountIds = user
      .getAccountIds()
      .filter((id) => this.accounts.has(id));
    if (accountIds.length === 0) {
      throw new AccountNotFoundError(
        `No accounts found for user ${userId} in bank ${this.id}`
      );
    }

    return accountIds;
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

    // Find all source accounts in priority order
    const fromAccountIds = this.findUserAccounts(fromUserId);
    const toAccountId = this.findUserAccountInBank(toUserId, toBankId);
    const toAccount = GlobalRegistry.getAccount(toAccountId);

    if (!toAccount) {
      throw new AccountNotFoundError(toAccountId);
    }

    // Try accounts in sequence until we can fulfill the transfer
    let remainingAmount = amount;
    let transferSuccessful = false;

    for (const accountId of fromAccountIds) {
      const fromAccount = this.getAccount(accountId);
      const availableBalance = fromAccount.getBalance();

      try {
        if (fromAccount.canDebit(remainingAmount)) {
          // This account can handle the full remaining amount
          fromAccount.debit(remainingAmount);
          toAccount.credit(remainingAmount);
          transferSuccessful = true;
          break;
        }
        if (fromAccount.canDebit(availableBalance)) {
          // This account can handle a partial amount
          fromAccount.debit(availableBalance);
          toAccount.credit(availableBalance);
          remainingAmount -= availableBalance;
        }
      } catch (error) {
        // If any error occurs during partial transfer, reverse it
        if (error instanceof Error && error.message !== "Insufficient funds") {
          toAccount.debit(amount - remainingAmount); // Reverse what we've transferred so far
          throw new BankError(`Transfer failed: ${error.message}`);
        }
      }
    }

    if (!transferSuccessful) {
      toAccount.debit(amount - remainingAmount); // Reverse any partial transfers
      throw new InsufficientFundsError(
        fromAccountIds.join(", "),
        amount,
        amount - remainingAmount
      );
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

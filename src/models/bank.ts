import BankAccount from "./bank-account";
import GlobalRegistry from "../services/GlobalRegistry";
import type { BankOptions } from "@/types/Common";

class Bank {
  private id: string;
  private accounts: Map<string, BankAccount>;
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

  getId(): string {
    return this.id;
  }

  createAccount(initialBalance: number): BankAccount {
    // Remove the third parameter (bankId) as it's not used in BankAccount.create
    const account = BankAccount.create(initialBalance, this.isNegativeAllowed);
    this.accounts.set(account.getId(), account);
    return account;
  }

  getAccount(accountId: string): BankAccount {
    // First try to get account from this bank's accounts
    const account = this.accounts.get(accountId);
    if (!account) {
      // If not found in this bank's accounts, try getting it from the global registry
      const globalAccount = GlobalRegistry.getAccount(accountId);
      if (!globalAccount) {
        throw new Error(`Account not found: ${accountId}`);
      }
      return globalAccount;
    }
    return account;
  }

  send(
    fromUserId: string,
    toUserId: string,
    amount: number,
    toBankId: string = this.id
  ): void {
    const fromUser = GlobalRegistry.getUser(fromUserId);
    const toUser = GlobalRegistry.getUser(toUserId);

    if (!fromUser || !toUser) {
      throw new Error("User not found");
    }

    // Find the account in this bank
    const fromAccountId = fromUser
      .getAccountIds()
      .find((accountId) => this.accounts.has(accountId));
    // Find the account in the target bank
    const toBank =
      toBankId === this.id ? this : GlobalRegistry.getBank(toBankId);
    if (!toBank) {
      throw new Error(`Bank not found: ${toBankId}`);
    }
    const toAccountId = toUser
      .getAccountIds()
      .find((accountId) => toBank.accounts.has(accountId));

    if (!fromAccountId || !toAccountId) {
      throw new Error("User has no accounts");
    }

    // Use GlobalRegistry to get accounts for inter-bank transfers
    const fromAccount = GlobalRegistry.getAccount(fromAccountId);
    if (!fromAccount) {
      throw new Error(`Account not found: ${fromAccountId}`);
    }

    const toAccount = GlobalRegistry.getAccount(toAccountId);
    if (!toAccount) {
      throw new Error(`Account not found: ${toAccountId}`);
    }

    fromAccount.debit(amount);
    toAccount.credit(amount);
  }
}

export default Bank;

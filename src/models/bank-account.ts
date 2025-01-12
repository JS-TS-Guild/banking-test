import GlobalRegistry from "../services/GlobalRegistry";
import type { BankAccountId } from "@/types/Common";

class AccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountError";
  }
}

class InsufficientFundsError extends AccountError {
  constructor(accountId: string, requested: number, available: number) {
    super(
      `Insufficient funds in account ${accountId}: requested ${requested}, available ${available}`
    );
    this.name = "InsufficientFundsError";
  }
}

class BankAccount {
  private id: BankAccountId;
  private balance: number;
  private allowNegativeBalance: boolean;
  private transactions: Transaction[] = [];

  private constructor(
    id: BankAccountId,
    balance: number,
    allowNegativeBalance: boolean
  ) {
    this.id = id;
    this.balance = balance;
    this.allowNegativeBalance = allowNegativeBalance;
  }

  static create(balance: number, allowNegativeBalance = false): BankAccount {
    if (balance < 0 && !allowNegativeBalance) {
      throw new AccountError(
        "Cannot create account with negative balance when negative balances are not allowed"
      );
    }
    const id = crypto.randomUUID();
    const account = new BankAccount(id, balance, allowNegativeBalance);
    GlobalRegistry.registerAccount(account);
    return account;
  }

  getId(): BankAccountId {
    return this.id;
  }

  getBalance(): number {
    return this.balance;
  }

  credit(amount: number): void {
    if (amount <= 0) {
      throw new AccountError("Credit amount must be positive");
    }
    this.balance += amount;
    this.recordTransaction("credit", amount);
  }

  debit(amount: number): void {
    if (amount <= 0) {
      throw new AccountError("Debit amount must be positive");
    }

    if (!this.allowNegativeBalance && this.balance < amount) {
      throw new InsufficientFundsError(this.id, amount, this.balance);
    }

    this.balance -= amount;
    this.recordTransaction("debit", amount);
  }

  private recordTransaction(type: "credit" | "debit", amount: number): void {
    this.transactions.push({
      type,
      amount,
      timestamp: new Date(),
      balanceAfter: this.balance,
    });
  }

  getTransactionHistory(): Transaction[] {
    return [...this.transactions];
  }

  canDebit(amount: number): boolean {
    return this.allowNegativeBalance || this.balance >= amount;
  }

  isNegativeBalanceAllowed(): boolean {
    return this.allowNegativeBalance;
  }
}

interface Transaction {
  type: "credit" | "debit";
  amount: number;
  timestamp: Date;
  balanceAfter: number;
}

export default BankAccount;
export { AccountError, InsufficientFundsError, type Transaction };

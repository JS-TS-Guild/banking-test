import GlobalRegistry from "../services/GlobalRegistry";

class BankAccount {
  private id: string;
  private balance: number;
  private allowNegativeBalance: boolean;

  private constructor(
    id: string,
    balance: number,
    allowNegativeBalance: boolean
  ) {
    this.id = id;
    this.balance = balance;
    this.allowNegativeBalance = allowNegativeBalance;
  }

  static create(balance: number, allowNegativeBalance = false): BankAccount {
    const id = crypto.randomUUID();
    const account = new BankAccount(id, balance, allowNegativeBalance);
    GlobalRegistry.registerAccount(account);
    return account;
  }

  getId(): string {
    return this.id;
  }

  getBalance(): number {
    return this.balance;
  }

  credit(amount: number): void {
    this.balance += amount;
  }

  debit(amount: number): void {
    if (!this.allowNegativeBalance && this.balance < amount) {
      throw new Error("Insufficient funds");
    }
    this.balance -= amount;
  }

  static getById(accountId: string): BankAccount {
    const account = GlobalRegistry.getAccount(accountId);
    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }
    return account;
  }
}

export default BankAccount;

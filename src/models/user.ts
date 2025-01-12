import BankAccount from "@/models/bank-account";
import GlobalRegistry from "../services/GlobalRegistry";
import type { BankAccountId } from "@/types/Common";

class User {
  private id: string;
  private name: string;
  private accountIds: BankAccountId[];

  private constructor(id: string, name: string, accountIds: BankAccountId[]) {
    this.id = id;
    this.name = name;
    this.accountIds = accountIds;
    GlobalRegistry.registerUser(this);
  }

  static create(name: string, accountIds: BankAccountId[]): User {
    const id = crypto.randomUUID();
    return new User(id, name, accountIds);
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getAccountIds(): BankAccountId[] {
    return [...this.accountIds];
  }
}

export default User;

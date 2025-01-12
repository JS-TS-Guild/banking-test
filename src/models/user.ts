import type { UserId, BankAccountId } from "@/types/Common";
import GlobalRegistry from "../services/GlobalRegistry";
import { v4 as uuidv4 } from "uuid";

class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

class User {
  private id: UserId;
  private name: string;
  private accountIds: Set<BankAccountId>;
  private email?: string;
  private createdAt: Date;
  private lastActive: Date;

  private constructor(
    id: UserId,
    name: string,
    accountIds: BankAccountId[],
    email?: string
  ) {
    this.id = id;
    this.name = name;
    this.accountIds = new Set(accountIds);
    this.email = email;
    this.createdAt = new Date();
    this.lastActive = new Date();
  }

  static create(
    name: string,
    accountIds: BankAccountId[] = [],
    email?: string
  ): User {
    if (!name.trim()) {
      throw new UserError("User name cannot be empty");
    }

    if (email && !User.isValidEmail(email)) {
      throw new UserError("Invalid email format");
    }

    const id = uuidv4();
    const user = new User(id, name.trim(), accountIds, email);
    GlobalRegistry.registerUser(user);
    return user;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getId(): UserId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getEmail(): string | undefined {
    return this.email;
  }

  setEmail(email: string): void {
    if (!User.isValidEmail(email)) {
      throw new UserError("Invalid email format");
    }
    this.email = email;
  }

  getAccountIds(): BankAccountId[] {
    return Array.from(this.accountIds);
  }

  addAccount(accountId: BankAccountId): void {
    if (!GlobalRegistry.getAccount(accountId)) {
      throw new UserError(`Account ${accountId} does not exist`);
    }
    this.accountIds.add(accountId);
  }

  removeAccount(accountId: BankAccountId): void {
    if (!this.accountIds.has(accountId)) {
      throw new UserError(`Account ${accountId} not found for user`);
    }
    if (this.accountIds.size === 1) {
      throw new UserError("Cannot remove last account from user");
    }
    this.accountIds.delete(accountId);
  }

  hasAccount(accountId: BankAccountId): boolean {
    return this.accountIds.has(accountId);
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  updateLastActive(): void {
    this.lastActive = new Date();
  }

  getLastActive(): Date {
    return new Date(this.lastActive);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      accountIds: Array.from(this.accountIds),
      createdAt: this.createdAt,
      lastActive: this.lastActive,
    };
  }
}

export default User;
export { UserError };
